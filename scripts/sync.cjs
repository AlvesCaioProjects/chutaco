// Manual sync script for football-data.org
// Usage: node scripts/sync.cjs
// Requires: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, FOOTBALL_DATA_API_KEY in .env.local
//
// Or: node scripts/sync.cjs --api-key=YOUR_KEY

const { createClient } = require('@supabase/supabase-js')
const https = require('https')
const fs = require('fs')
const path = require('path')

function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers, timeout: 30000 }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve({ status: res.statusCode, data }))
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')) })
  })
}

async function main() {
  const envPath = path.resolve(__dirname, '..', '.env.local')
  let envVars = {}
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
      const [key, ...rest] = line.split('=')
      if (key && rest.length) envVars[key.trim()] = rest.join('=').trim()
    })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || envVars.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || envVars.VITE_SUPABASE_ANON_KEY
  let apiKey = process.env.FOOTBALL_DATA_API_KEY || envVars.FOOTBALL_DATA_API_KEY || envVars.VITE_FOOTBALL_DATA_API_KEY

  const args = process.argv.slice(2)
  args.forEach(arg => {
    if (arg.startsWith('--api-key=')) apiKey = arg.split('=')[1]
  })

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials. Check .env.local')
    process.exit(1)
  }

  if (!apiKey || apiKey === 'YOUR_FOOTBALL_DATA_API_KEY') {
    console.error('❌ Missing football-data.org API key.')
    console.error('   Set FOOTBALL_DATA_API_KEY in .env.local or pass --api-key=YOUR_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: comps, error: compError } = await supabase
    .from('competitions')
    .select('id')
    .eq('status', 'active')
    .limit(1)

  if (compError || !comps?.length) {
    console.error('❌ No active competition found')
    process.exit(1)
  }

  const competitionId = comps[0].id

  console.log('📡 Fetching matches from football-data.org...')
  const { status, data: body } = await httpsGet(
    'https://api.football-data.org/v4/competitions/WC/matches',
    { 'X-Auth-Token': apiKey }
  )

  if (status !== 200) {
    const errMsg = `API returned status ${status}`
    console.error(`❌ ${errMsg}`)
    await supabase.from('sync_logs').insert({ status: 'error', message: errMsg })
    process.exit(1)
  }

  const json = JSON.parse(body)
  const matches = json.matches || []
  console.log(`📊 Found ${matches.length} matches`)

  let matchCount = 0
  let errorCount = 0

  for (const match of matches) {
    let homeTeam, awayTeam, matchTime, extId, winner
    try {
      homeTeam = match.homeTeam?.name || 'Unknown'
      awayTeam = match.awayTeam?.name || 'Unknown'
      matchTime = match.utcDate
      extId = match.id
      winner = match.score?.winner

      let result = null
      if (winner === 'HOME_TEAM') result = 'team_a'
      else if (winner === 'AWAY_TEAM') result = 'team_b'
      else if (winner === 'DRAW') result = 'draw'

      // Check if match already exists by external_id
      const { data: existing } = await supabase
        .from('matches')
        .select('id')
        .eq('external_id', extId)
        .maybeSingle()

      if (existing) {
        const { error: updError } = await supabase
          .from('matches')
          .update({ team_a: homeTeam, team_b: awayTeam, scheduled_time: matchTime, result, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
        if (updError) throw updError
      } else {
        const { error: insError } = await supabase
          .from('matches')
          .insert({ competition_id: competitionId, team_a: homeTeam, team_b: awayTeam, scheduled_time: matchTime, result, external_id: extId })
        if (insError) throw insError
      }

      matchCount++
    } catch (err) {
      errorCount++
      const detail = `${err.code || ''} ${err.message || ''}`.trim()
      console.error(`  ⚠️ [${extId}] ${homeTeam} vs ${awayTeam}: ${detail}`)
    }
  }

  const msg = `Synced ${matchCount} matches${errorCount ? ` (${errorCount} errors)` : ''}`
  console.log(`✅ ${msg}`)

  await supabase.from('sync_logs').insert({
    status: errorCount > matchCount ? 'error' : 'success',
    message: msg,
  })
}

main()
