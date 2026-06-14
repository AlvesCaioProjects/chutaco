import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Leagues() {
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [leagueName, setLeagueName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [selectedLeague, setSelectedLeague] = useState(null)
  const [ranking, setRanking] = useState([])
  const [rankingLoading, setRankingLoading] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { loadLeagues() }, [])

  const loadLeagues = async () => {
    try {
      setError('')
      setLoading(true)

      const { data: owned } = await supabase
        .from('leagues').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })

      const { data: memberships } = await supabase
        .from('league_members').select('league:league_id(*)').eq('user_id', user.id)

      const memberLeagues = (memberships || [])
        .map(m => m.league)
        .filter(l => l && !owned?.some(o => o.id === l.id))

      setLeagues([...(owned || []), ...memberLeagues])
    } catch (err) {
      setError(err.message || 'Erro ao carregar ligas')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!leagueName.trim()) { setError('Digite um nome para a liga'); return }
    try {
      const { data: league } = await supabase.from('leagues').insert({ name: leagueName.trim(), owner_id: user.id }).select().single()
      await supabase.from('league_members').insert({ league_id: league.id, user_id: user.id })
      setSuccess(`Liga "${league.name}" criada! Código: ${league.code}`)
      setShowCreate(false); setLeagueName('')
      await loadLeagues()
    } catch (err) { setError(err.message || 'Erro ao criar liga') }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!joinCode.trim()) { setError('Digite o código da liga'); return }
    try {
      const { data: league } = await supabase.from('leagues').select('*').eq('code', joinCode.trim()).single()
      if (!league) throw new Error('Código inválido')
      const { data: existing } = await supabase.from('league_members').select('*').eq('league_id', league.id).eq('user_id', user.id).maybeSingle()
      if (existing) throw new Error('Você já está nessa liga')
      await supabase.from('league_members').insert({ league_id: league.id, user_id: user.id })
      setSuccess(`Você entrou na liga "${league.name}"!`)
      setShowJoin(false); setJoinCode('')
      await loadLeagues()
    } catch (err) { setError(err.message || 'Erro ao entrar na liga') }
  }

  const handleLeave = async (leagueId) => {
    try {
      await supabase.from('league_members').delete().eq('league_id', leagueId).eq('user_id', user.id)
      if (selectedLeague?.id === leagueId) { setSelectedLeague(null); setRanking([]) }
      setSuccess('Você saiu da liga')
      await loadLeagues()
    } catch (err) { setError(err.message || 'Erro ao sair da liga') }
  }

  const handleDelete = async (leagueId) => {
    try {
      await supabase.from('leagues').delete().eq('id', leagueId).eq('owner_id', user.id)
      if (selectedLeague?.id === leagueId) { setSelectedLeague(null); setRanking([]) }
      setSuccess('Liga excluída')
      await loadLeagues()
    } catch (err) { setError(err.message || 'Erro ao excluir liga') }
  }

  const loadRanking = async (league) => {
    setSelectedLeague(league); setRankingLoading(true)
    try {
      const { data } = await supabase.from('league_rankings').select('*').eq('league_id', league.id).order('total_points', { ascending: false })
      setRanking(data || [])
    } catch (err) { setError(err.message || 'Erro ao carregar ranking') }
    finally { setRankingLoading(false) }
  }

  if (loading) {
    return (
      <div className="min-h-screen page-bg p-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando ligas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen page-bg">
      <header className="bg-gradient-to-r from-purple-700 to-purple-600 dark:from-gray-800 dark:to-gray-900 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate('/')} className="text-white hover:text-purple-100 mb-3 font-bold text-sm">← Voltar</button>
          <h1 className="text-2xl md:text-3xl font-bold">👥 Minhas Ligas</h1>
          <p className="text-purple-100 text-sm">Crie ou entre em ligas com amigos</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">{success}</div>}

        <div className="flex gap-3 mb-6">
          <button onClick={() => { setShowCreate(true); setShowJoin(false) }} className="btn-purple flex-1 text-sm">✨ Criar Liga</button>
          <button onClick={() => { setShowJoin(true); setShowCreate(false) }} className="btn-blue flex-1 text-sm">🔑 Entrar</button>
        </div>

        {showCreate && (
          <div className="card mb-6">
            <h2 className="text-lg font-bold mb-4">Nova Liga</h2>
            <form onSubmit={handleCreate}>
              <input type="text" value={leagueName} onChange={(e) => setLeagueName(e.target.value)} placeholder="Nome da liga" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg mb-3 text-sm" autoFocus />
              <div className="flex gap-2">
                <button type="submit" className="btn-purple text-sm">Criar</button>
                <button type="button" onClick={() => setShowCreate(false)} className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-5 rounded-lg text-sm">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {showJoin && (
          <div className="card mb-6">
            <h2 className="text-lg font-bold mb-4">Entrar em Liga</h2>
            <form onSubmit={handleJoin}>
              <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Código da liga" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg mb-3 text-sm" autoFocus />
              <div className="flex gap-2">
                <button type="submit" className="btn-blue text-sm">Entrar</button>
                <button type="button" onClick={() => setShowJoin(false)} className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-5 rounded-lg text-sm">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {leagues.length === 0 && !showCreate && !showJoin ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-1">Você não está em nenhuma liga</p>
            <p className="text-gray-400 text-sm">Crie uma liga ou entre com um código</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leagues.map(league => {
              const isOwner = league.owner_id === user.id
              return (
                <div
                  key={league.id}
                  onClick={() => loadRanking(league)}
                  className={`card cursor-pointer border-l-4 transition ${
                    selectedLeague?.id === league.id ? 'border-l-purple-500' : 'border-l-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-gray-800">{league.name}</h3>
                      {isOwner && <span className="badge-green text-xs py-0.5">Dono</span>}
                      <p className="text-xs text-gray-500 mt-1">Código: <span className="font-mono font-bold">{league.code}</span></p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); isOwner ? handleDelete(league.id) : handleLeave(league.id) }}
                      className="text-red-500 hover:text-red-700 text-sm font-bold"
                    >
                      {isOwner ? 'Excluir' : 'Sair'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {selectedLeague && (
          <div className="mt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-3">🏆 Ranking: {selectedLeague.name}</h2>
            <p className="text-sm text-gray-500 mb-4">Compartilhe o código <span className="font-mono font-bold">{selectedLeague.code}</span> para convidar amigos</p>

            {rankingLoading ? (
              <div className="card text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : ranking.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-gray-500">Nenhum palpite na liga ainda</p>
              </div>
            ) : (
              <div className="card p-0 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-600">#</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-600">Usuário</th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-gray-600">Pts</th>
                      <th className="hidden sm:table-cell px-3 py-3 text-center text-xs font-bold text-gray-600">Taxa</th>
                      <th className="hidden md:table-cell px-3 py-3 text-center text-xs font-bold text-gray-600">Streak</th>
                      <th className="hidden md:table-cell px-3 py-3 text-center text-xs font-bold text-gray-600">Palpites</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((r, i) => (
                      <tr key={r.id} className={`border-b border-gray-100 ${r.id === user.id ? 'bg-purple-50 font-bold' : ''}`}>
                        <td className="px-3 py-3"><span className="font-bold text-sm">#{i + 1}</span></td>
                        <td className="px-3 py-3 text-sm">
                          {r.username}
                          {r.id === user.id && <span className="badge-green text-xs ml-1 py-0.5">Você</span>}
                        </td>
                        <td className="px-3 py-3 text-center font-bold">{r.total_points}</td>
                        <td className="hidden sm:table-cell px-3 py-3 text-center">
                          <span className="badge-blue text-xs">{r.accuracy_rate?.toFixed(1)}%</span>
                        </td>
                        <td className="hidden md:table-cell px-3 py-3 text-center">{r.current_streak}</td>
                        <td className="hidden md:table-cell px-3 py-3 text-center text-gray-500 text-sm">{r.total_predictions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
