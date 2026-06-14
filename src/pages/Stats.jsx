import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Stats() {
  const [stats, setStats] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setError('')
      setLoading(true)

      const { data: rankData, error: rankError } = await supabase
        .from('global_rankings')
        .select('*')
        .eq('id', user.id)
        .single()

      if (rankError) throw rankError
      setStats(rankData)

      const { data: preds, error: predError } = await supabase
        .from('predictions')
        .select('*, match:match_id(team_a, team_b, result, scheduled_time)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (predError) throw predError
      setPredictions(preds || [])
    } catch (err) {
      setError(err.message || 'Erro ao carregar estatísticas')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando estatísticas...</p>
          </div>
        </div>
      </div>
    )
  }

  const correct = predictions.filter(p => p.points === 1).length
  const incorrect = predictions.filter(p => p.points === 0 && p.match?.result != null).length
  const pending = predictions.filter(p => p.match?.result == null).length

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="text-white hover:text-indigo-100 mb-4 font-bold"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold">📊 Minhas Estatísticas</h1>
          <p className="text-indigo-100">Seu desempenho no Chutaço</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Main Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-4xl font-bold text-indigo-600">{stats.total_points}</p>
              <p className="text-gray-500 text-sm mt-1">Pontos</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-4xl font-bold text-green-600">{stats.accuracy_rate?.toFixed(1)}%</p>
              <p className="text-gray-500 text-sm mt-1">Taxa de Acerto</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-4xl font-bold text-orange-600">{stats.current_streak}</p>
              <p className="text-gray-500 text-sm mt-1">Melhor Streak</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-4xl font-bold text-gray-700">{stats.total_predictions}</p>
              <p className="text-gray-500 text-sm mt-1">Total Palpites</p>
            </div>
          </div>
        )}

        {/* Prediction Breakdown */}
        {predictions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Distribuição de Palpites</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-600 font-bold">✅ Acertos ({correct})</span>
                  <span className="text-gray-500">{correct > 0 ? ((correct / (correct + incorrect)) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 rounded-full h-3 transition-all"
                    style={{ width: `${(correct + incorrect) > 0 ? (correct / (correct + incorrect)) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-600 font-bold">❌ Erros ({incorrect})</span>
                  <span className="text-gray-500">{incorrect > 0 ? ((incorrect / (correct + incorrect)) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-red-500 rounded-full h-3 transition-all"
                    style={{ width: `${(correct + incorrect) > 0 ? (incorrect / (correct + incorrect)) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            {pending > 0 && (
              <p className="text-sm text-gray-500 mt-3">
                ⏳ {pending} palpite{pending > 1 ? 's' : ''} aguardando resultado
              </p>
            )}
          </div>
        )}

        {/* Recent Predictions */}
        {predictions.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">Últimos Palpites</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {predictions.slice(0, 10).map(p => {
                const match = p.match
                const isCorrect = p.points === 1
                const hasResult = match?.result != null

                return (
                  <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800">
                        {match?.team_a} vs {match?.team_b}
                      </p>
                      <p className="text-xs text-gray-500">
                        {match?.scheduled_time ? new Date(match.scheduled_time).toLocaleString('pt-BR') : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      {hasResult ? (
                        <span className={`text-sm font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                          {isCorrect ? '+1' : '0'}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">⏳</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {predictions.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg">Nenhum palpite realizado ainda</p>
          </div>
        )}
      </main>
    </div>
  )
}
