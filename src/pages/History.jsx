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

  useEffect(() => {
    loadHistory()
  }, [])

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

      const dates = [...new Set((data || []).map(item =>
        new Date(item.match.scheduled_time).toLocaleDateString('pt-BR')
      ))]
      setAvailableDates(dates)
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
      const match = item.match
      if (!match.team_a.toLowerCase().includes(search) &&
          !match.team_b.toLowerCase().includes(search)) {
        return false
      }
    }
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando histórico...</p>
          </div>
        </div>
      </div>
    )
  }

  const stats = {
    total: filteredHistory.length,
    correct: filteredHistory.filter(h => h.points === 1).length,
  }
  const accuracy = stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : 0

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="text-white hover:text-blue-100 mb-4 font-bold"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold">📋 Histórico de Palpites</h1>
          <p className="text-blue-100">Seus palpites e resultados</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Stats Summary */}
        {filteredHistory.length > 0 && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold">{stats.correct}</p>
                <p className="text-sm text-blue-100">Acertos</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{accuracy}%</p>
                <p className="text-sm text-blue-100">Taxa</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.total}</p>
                <p className="text-sm text-blue-100">Total</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-bold text-gray-700 mb-1">Filtrar por data</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Todas as datas</option>
                {availableDates.map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-bold text-gray-700 mb-1">Filtrar por time/país</label>
              <input
                type="text"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                placeholder="Digite o nome do time..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg">
              {history.length === 0
                ? 'Nenhum palpite em jogos finalizados ainda'
                : 'Nenhum resultado encontrado para esses filtros'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map(item => {
              const match = item.match
              const isCorrect = item.points === 1

              const predictionLabel = item.prediction === 'team_a' ? match.team_a
                : item.prediction === 'team_b' ? match.team_b
                : 'Empate'

              const resultLabel = match.result === 'team_a' ? match.team_a
                : match.result === 'team_b' ? match.team_b
                : 'Empate'

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg shadow p-4 border-l-4 transition ${
                    isCorrect ? 'border-l-green-500' : 'border-l-red-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-gray-500">
                      {new Date(match.scheduled_time).toLocaleString('pt-BR')}
                    </p>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      isCorrect
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {isCorrect ? '✅ +1 Ponto' : '❌ 0 Pontos'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-center">
                      <p className="text-lg font-bold text-gray-800">{match.team_a}</p>
                      <p className={`text-xs font-bold mt-1 ${
                        match.result === 'team_a' ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {match.result === 'team_a' ? '⭐ Resultado' : ''}
                      </p>
                    </div>

                    <div className="px-4 text-center">
                      <p className="text-lg font-bold text-gray-400">vs</p>
                    </div>

                    <div className="flex-1 text-center">
                      <p className="text-lg font-bold text-gray-800">{match.team_b}</p>
                      <p className={`text-xs font-bold mt-1 ${
                        match.result === 'team_b' ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {match.result === 'team_b' ? '⭐ Resultado' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
                    <div>
                      <span className="text-gray-500">Seu palpite: </span>
                      <span className={`font-bold ${
                        isCorrect ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {predictionLabel}
                      </span>
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
