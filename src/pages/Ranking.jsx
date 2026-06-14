import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Ranking() {
  const [rankings, setRankings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userRank, setUserRank] = useState(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadRankings()
    const interval = setInterval(loadRankings, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadRankings = async () => {
    try {
      setError('')
      setLoading(true)

      // Fetch global rankings from view
      const { data: rankingsData, error: rankingsError } = await supabase
        .from('global_rankings')
        .select('*')
        .order('total_points', { ascending: false })
        .order('accuracy_rate', { ascending: false })
        .order('current_streak', { ascending: false })

      if (rankingsError) throw rankingsError

      setRankings(rankingsData || [])

      // Find current user's rank
      const userIndex = rankingsData?.findIndex(r => r.id === user.id)
      if (userIndex !== -1) {
        setUserRank({
          position: userIndex + 1,
          ...rankingsData[userIndex],
        })
      }
    } catch (err) {
      setError(err.message || 'Erro ao carregar ranking')
      console.error('Ranking error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando ranking...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="text-white hover:text-yellow-100 mb-4 font-bold"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold">🏆 Ranking Global</h1>
          <p className="text-yellow-100">Veja como você se posiciona</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* User's Rank Card */}
        {userRank && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-4xl font-bold"># {userRank.position}</p>
                <p className="text-sm text-green-100">Posição</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold">{userRank.total_points}</p>
                <p className="text-sm text-green-100">Pontos</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold">{userRank.accuracy_rate?.toFixed(1)}%</p>
                <p className="text-sm text-green-100">Taxa</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold">{userRank.current_streak}</p>
                <p className="text-sm text-green-100">Streak</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold">{userRank.total_predictions}</p>
                <p className="text-sm text-green-100">Palpites</p>
              </div>
            </div>
          </div>
        )}

        {/* Rankings Table */}
        {rankings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg">Nenhum palpite realizado ainda</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-200 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-2 md:px-4 py-3 text-left">#</th>
                    <th className="px-2 md:px-4 py-3 text-left">Usuário</th>
                    <th className="px-2 md:px-4 py-3 text-center">Pts</th>
                    <th className="hidden sm:table-cell px-2 md:px-4 py-3 text-center">Taxa</th>
                    <th className="hidden md:table-cell px-2 md:px-4 py-3 text-center">Streak</th>
                    <th className="hidden md:table-cell px-2 md:px-4 py-3 text-center">Palpites</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((rank, index) => (
                    <tr
                      key={rank.id}
                      className={`border-b ${
                        rank.id === user.id
                          ? 'bg-green-50 font-bold'
                          : index % 2 === 0
                          ? 'bg-white'
                          : 'bg-gray-50'
                      } hover:bg-gray-100 transition`}
                    >
                      <td className="px-2 md:px-4 py-3">
                        <div className="flex items-center gap-1 md:gap-2">
                          {index === 0 && <span className="text-sm md:text-base">🥇</span>}
                          {index === 1 && <span className="text-sm md:text-base">🥈</span>}
                          {index === 2 && <span className="text-sm md:text-base">🥉</span>}
                          <span className="font-bold text-sm md:text-base">#{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-2 md:px-4 py-3">
                        <div>
                          <p className="text-sm md:text-base">{rank.username}</p>
                          {rank.id === user.id && (
                            <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">
                              Você
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 md:px-4 py-3 text-center font-bold text-base md:text-lg">
                        {rank.total_points}
                      </td>
                      <td className="hidden sm:table-cell px-2 md:px-4 py-3 text-center">
                        <span className="bg-blue-100 text-blue-800 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm">
                          {rank.accuracy_rate?.toFixed(1)}%
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-2 md:px-4 py-3 text-center">
                        <span className="bg-orange-100 text-orange-800 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm">
                          {rank.current_streak}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-2 md:px-4 py-3 text-center text-gray-600 text-sm">
                        {rank.total_predictions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 mb-3">📊 Legenda das Métricas</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>
              <strong>Pontos:</strong> Total de pontos acumulados (1 ponto por acerto)
            </li>
            <li>
              <strong>Taxa de Acerto:</strong> Percentual de palpites corretos (acertos / total)
            </li>
            <li>
              <strong>Streak:</strong> Maior sequência de acertos consecutivos
            </li>
            <li>
              <strong>Total de Palpites:</strong> Quantidade de palpites realizados
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}
