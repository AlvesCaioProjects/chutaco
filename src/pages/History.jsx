import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function History() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [teamFilter, setTeamFilter] = useState('')
  const [availableDates, setAvailableDates] = useState([])
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { loadHistory() }, [])

  const loadHistory = async () => {
    try {
      setError('')
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('predictions')
        .select('*, match:match_id(*)')
        .eq('user_id', user.id)

      if (fetchError) throw fetchError

      const filtered = (data || []).filter(item => item.match?.result != null)
      const sorted = filtered.sort((a, b) =>
        new Date(b.match.scheduled_time) - new Date(a.match.scheduled_time)
      )
      setHistory(sorted)
      setAvailableDates([...new Set(sorted.map(item =>
        new Date(item.match.scheduled_time).toLocaleDateString('pt-BR')
      ))])
    } catch (err) {
      setError(err.message || 'Erro ao carregar histórico')
    } finally {
      setLoading(false)
    }
  }

  const filteredHistory = history.filter(item => {
    if (dateFilter !== 'all') {
      const itemDate = new Date(item.match.scheduled_time).toLocaleDateString('pt-BR')
      if (itemDate !== dateFilter) return false
    }
    if (teamFilter) {
      const search = teamFilter.toLowerCase()
      const m = item.match
      if (!m.team_a.toLowerCase().includes(search) && !m.team_b.toLowerCase().includes(search)) return false
    }
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen page-bg p-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando histórico...</p>
        </div>
      </div>
    )
  }

  const correct = filteredHistory.filter(h => h.points === 1).length
  const total = filteredHistory.length
  const accuracy = total > 0 ? ((correct / total) * 100).toFixed(1) : 0

  return (
    <div className="min-h-screen page-bg">
      <header className="bg-gradient-to-r from-blue-700 to-blue-600 dark:from-gray-800 dark:to-gray-900 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate('/')} className="text-white hover:text-blue-100 mb-3 font-bold text-sm">
            ← Voltar
          </button>
          <h1 className="text-2xl md:text-3xl font-bold">📋 Histórico</h1>
          <p className="text-blue-100 text-sm">Seus palpites e resultados</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {total > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="card text-center py-4">
              <p className="text-2xl font-bold text-green-600">{correct}</p>
              <p className="text-xs text-gray-500">Acertos</p>
            </div>
            <div className="card text-center py-4">
              <p className="text-2xl font-bold text-blue-600">{accuracy}%</p>
              <p className="text-xs text-gray-500">Taxa</p>
            </div>
            <div className="card text-center py-4">
              <p className="text-2xl font-bold text-gray-700">{total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-bold text-gray-600 mb-1">Filtrar por data</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">Todas as datas</option>
                {availableDates.map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-bold text-gray-600 mb-1">Filtrar por time</label>
              <input
                type="text"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                placeholder="Digite o nome do time..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">
              {history.length === 0 ? 'Nenhum palpite em jogos finalizados ainda' : 'Nenhum resultado encontrado'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map(item => {
              const match = item.match
              const isCorrect = item.points === 1

              const predictionLabel = item.prediction === 'team_a' ? match.team_a
                : item.prediction === 'team_b' ? match.team_b : 'Empate'

              const resultLabel = match.result === 'team_a' ? match.team_a
                : match.result === 'team_b' ? match.team_b : 'Empate'

              return (
                <div key={item.id} className={`card border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs text-gray-500">
                      {new Date(match.scheduled_time).toLocaleString('pt-BR')}
                    </p>
                    <span className={`badge-${isCorrect ? 'green' : 'red'} text-xs`}>
                      {isCorrect ? '✅ +1' : '❌ 0'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-center">
                      <p className="text-sm md:text-lg font-bold text-gray-800">{match.team_a}</p>
                      {match.result === 'team_a' && <p className="text-xs text-green-600 font-bold mt-1">⭐ Resultado</p>}
                    </div>
                    <div className="px-2 md:px-4 text-gray-400 font-bold text-sm">vs</div>
                    <div className="flex-1 text-center">
                      <p className="text-sm md:text-lg font-bold text-gray-800">{match.team_b}</p>
                      {match.result === 'team_b' && <p className="text-xs text-green-600 font-bold mt-1">⭐ Resultado</p>}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs md:text-sm">
                    <div>
                      <span className="text-gray-500">Seu palpite: </span>
                      <span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{predictionLabel}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Resultado: </span>
                      <span className="font-bold text-gray-700">{resultLabel}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
