import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Stats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { loadStats() }, [])

  const loadStats = async () => {
    try {
      setError('')
      setLoading(true)

      const { data: predictions, error: pErr } = await supabase
        .from('predictions')
        .select('*, match:match_id(*)')
        .eq('user_id', user.id)

      if (pErr) throw pErr

      const finished = (predictions || []).filter(p => p.match?.result != null)
      const total = finished.length
      const correct = finished.filter(p => p.points === 1).length
      const accuracy = total > 0 ? (correct / total) * 100 : 0

      let currentStreak = 0
      const sorted = [...finished].sort((a, b) =>
        new Date(b.match.scheduled_time) - new Date(a.match.scheduled_time)
      )
      for (const p of sorted) {
        if (p.points === 1) currentStreak++
        else break
      }

      let bestStreak = 0
      let streak = 0
      for (const p of [...sorted].reverse()) {
        if (p.points === 1) { streak++; bestStreak = Math.max(bestStreak, streak) }
        else streak = 0
      }

      const totalPoints = finished.reduce((sum, p) => sum + (p.points || 0), 0)

      const teamStats = {}
      for (const p of finished) {
        const m = p.match
        for (const team of [m.team_a, m.team_b]) {
          if (!teamStats[team]) {
            const matches = finished.filter(f => f.match.team_a === team || f.match.team_b === team)
            const correctOn = matches.filter(f => f.points === 1).length
            teamStats[team] = {
              team,
              total: matches.length,
              correct: correctOn,
              accuracy: matches.length > 0 ? (correctOn / matches.length) * 100 : 0
            }
          }
        }
      }

      const correctPreds = finished.filter(p => p.points === 1)
      const wrongPreds = finished.filter(p => p.points === 0)

      const lastPredictions = sorted.slice(0, 10)

      setStats({ total, correct, accuracy, currentStreak, bestStreak, totalPoints, teamStats: Object.values(teamStats), correctPreds, wrongPreds, lastPredictions })
    } catch (err) {
      setError(err.message || 'Erro ao carregar estatísticas')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen page-bg p-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando estatísticas...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen page-bg p-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-gray-500">Nenhum dado disponível</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen page-bg">
      <header className="bg-gradient-to-r from-green-700 to-green-600 dark:from-gray-800 dark:to-gray-900 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate('/')} className="text-white hover:text-green-100 mb-3 font-bold text-sm">← Voltar</button>
          <h1 className="text-2xl md:text-3xl font-bold">📊 Estatísticas</h1>
          <p className="text-green-100 text-sm">Suas métricas detalhadas</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="card text-center py-4">
            <p className="text-2xl font-bold text-green-600">{stats.totalPoints}</p>
            <p className="text-xs text-gray-500">Total Pontos</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-2xl font-bold text-blue-600">{stats.correct}</p>
            <p className="text-xs text-gray-500">Acertos</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-2xl font-bold text-purple-600">{stats.accuracy.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">Taxa</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-2xl font-bold text-orange-600">{stats.bestStreak}</p>
            <p className="text-xs text-gray-500">Melhor Streak</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-2xl font-bold text-gray-700">{stats.currentStreak}</p>
            <p className="text-xs text-gray-500">Streak Atual</p>
          </div>
        </div>

        <div className="card mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Acertos vs Erros</h3>
          <div className="flex h-6 rounded-full overflow-hidden bg-gray-200">
            <div
              className="bg-green-500 transition-all duration-500"
              style={{ width: `${stats.accuracy}%` }}
            ></div>
            <div
              className="bg-red-500 transition-all duration-500"
              style={{ width: `${100 - stats.accuracy}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-xs text-green-600 font-bold">{stats.accuracy.toFixed(1)}% Acertos</p>
            <p className="text-xs text-red-600 font-bold">{(100 - stats.accuracy).toFixed(1)}% Erros</p>
          </div>
        </div>

        {stats.lastPredictions.length > 0 && (
          <div className="card mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Últimos Palpites</h3>
            <div className="space-y-2">
              {stats.lastPredictions.map(p => {
                const m = p.match
                const predLabel = p.prediction === 'team_a' ? m.team_a : p.prediction === 'team_b' ? m.team_b : 'Empate'
                const resultLabel = m.result === 'team_a' ? m.team_a : m.result === 'team_b' ? m.team_b : 'Empate'
                return (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <p className="text-xs md:text-sm font-medium">
                        {m.team_a} vs {m.team_b}
                      </p>
                      <p className="text-xs text-gray-500">Palpite: {predLabel} → Resultado: {resultLabel}</p>
                    </div>
                    <span className={`badge-${p.points === 1 ? 'green' : 'red'} text-xs ml-2`}>
                      {p.points === 1 ? '+1' : '0'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {stats.teamStats.length > 0 && (
          <div className="card mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3">🏟️ Estatísticas por Time</h3>
            <div className="space-y-2">
              {stats.teamStats
                .sort((a, b) => b.total - a.total)
                .slice(0, 10)
                .map(ts => (
                  <div key={ts.team} className="py-2">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium">{ts.team}</p>
                      <p className="text-xs text-gray-500">{ts.correct}/{ts.total} ({ts.accuracy.toFixed(0)}%)</p>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${ts.accuracy}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <h3 className="text-sm font-bold text-green-700 mb-2">✅ Mais Acertos</h3>
            <div className="space-y-2">
              {stats.correctPreds.slice(0, 5).length > 0 ? (
                stats.correctPreds.slice(0, 5).map(p => (
                  <div key={p.id} className="text-xs text-gray-600 py-1 border-b border-green-100 last:border-0">
                    {p.match.team_a} vs {p.match.team_b}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">Nenhum acerto ainda</p>
              )}
            </div>
          </div>
          <div className="card">
            <h3 className="text-sm font-bold text-red-700 mb-2">❌ Mais Erros</h3>
            <div className="space-y-2">
              {stats.wrongPreds.slice(0, 5).length > 0 ? (
                stats.wrongPreds.slice(0, 5).map(p => (
                  <div key={p.id} className="text-xs text-gray-600 py-1 border-b border-red-100 last:border-0">
                    {p.match.team_a} vs {p.match.team_b}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">Nenhum erro ainda</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
