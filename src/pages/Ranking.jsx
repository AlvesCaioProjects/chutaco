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
    const interval = setInterval(loadRankings, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadRankings = async () => {
    try {
      setError('')
      setLoading(true)
      const { data: rankingsData, error: rankingsError } = await supabase
        .from('global_rankings')
        .select('*')
        .order('total_points', { ascending: false })
        .order('accuracy_rate', { ascending: false })
        .order('current_streak', { ascending: false })

      if (rankingsError) throw rankingsError
      setRankings(rankingsData || [])

      const userIndex = rankingsData?.findIndex(r => r.id === user.id)
      if (userIndex !== -1) {
        setUserRank({ position: userIndex + 1, ...rankingsData[userIndex] })
      }
    } catch (err) {
      setError(err.message || 'Erro ao carregar ranking')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen page-bg p-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando ranking...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen page-bg">
      <header className="bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-gray-800 dark:to-gray-900 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate('/')} className="text-white hover:text-yellow-100 mb-3 font-bold text-sm">
            ← Voltar
          </button>
          <h1 className="text-2xl md:text-3xl font-bold">🏆 Ranking Global</h1>
          <p className="text-yellow-100 text-sm">Veja como você se posiciona</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {userRank && (
          <div className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 text-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
            <p className="text-xs text-yellow-100 mb-3 font-bold">SEU RANKING</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
              <div className="text-center">
                <p className="text-2xl md:text-4xl font-bold">#{userRank.position}</p>
                <p className="text-xs text-yellow-100">Posição</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-4xl font-bold">{userRank.total_points}</p>
                <p className="text-xs text-yellow-100">Pontos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-4xl font-bold">{userRank.accuracy_rate?.toFixed(1)}%</p>
                <p className="text-xs text-yellow-100">Taxa</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-4xl font-bold">{userRank.current_streak}</p>
                <p className="text-xs text-yellow-100">Streak</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-4xl font-bold">{userRank.total_predictions}</p>
                <p className="text-xs text-yellow-100">Palpites</p>
              </div>
            </div>
          </div>
        )}

        {rankings.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">Nenhum palpite realizado ainda</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-bold text-gray-600">#</th>
                    <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-bold text-gray-600">Usuário</th>
                    <th className="px-2 md:px-4 py-3 text-center text-xs md:text-sm font-bold text-gray-600">Pts</th>
                    <th className="hidden sm:table-cell px-2 md:px-4 py-3 text-center text-xs md:text-sm font-bold text-gray-600">Taxa</th>
                    <th className="hidden md:table-cell px-2 md:px-4 py-3 text-center text-xs md:text-sm font-bold text-gray-600">Streak</th>
                    <th className="hidden md:table-cell px-2 md:px-4 py-3 text-center text-xs md:text-sm font-bold text-gray-600">Palpites</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((rank, index) => (
                    <tr
                      key={rank.id}
                      className={`border-b border-gray-100 ${
                        rank.id === user.id ? 'bg-green-50 font-bold' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      } hover:bg-green-50/50 transition`}
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
                        <p className="text-sm md:text-base">{rank.username}</p>
                        {rank.id === user.id && (
                          <span className="badge-green text-xs py-0.5">Você</span>
                        )}
                      </td>
                      <td className="px-2 md:px-4 py-3 text-center font-bold text-base md:text-lg">
                        {rank.total_points}
                      </td>
                      <td className="hidden sm:table-cell px-2 md:px-4 py-3 text-center">
                        <span className="badge-blue text-xs">{rank.accuracy_rate?.toFixed(1)}%</span>
                      </td>
                      <td className="hidden md:table-cell px-2 md:px-4 py-3 text-center">
                        <span className="badge-orange text-xs">{rank.current_streak}</span>
                      </td>
                      <td className="hidden md:table-cell px-2 md:px-4 py-3 text-center text-gray-500 text-sm">
                        {rank.total_predictions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 card bg-blue-50/50 border-blue-100">
          <h3 className="font-bold text-blue-900 text-sm mb-2">📊 Legenda das Métricas</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li><strong>Pontos:</strong> Total acumulado (1 ponto por acerto)</li>
            <li><strong>Taxa de Acerto:</strong> Percentual de palpites corretos</li>
            <li><strong>Streak:</strong> Maior sequência de acertos consecutivos</li>
            <li><strong>Palpites:</strong> Quantidade de palpites realizados</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
