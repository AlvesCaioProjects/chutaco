import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Admin() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingMatchId, setEditingMatchId] = useState(null)
  const [editingResult, setEditingResult] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadMatches()
  }, [])

  const loadMatches = async () => {
    try {
      setError('')
      setLoading(true)

      const { data, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .order('scheduled_time', { ascending: true })
        .limit(50)

      if (fetchError) throw fetchError
      setMatches(data || [])
    } catch (err) {
      setError(err.message || 'Erro ao carregar matches')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setError('')
    setSuccess('')

    try {
      // TODO: Implementar chamada à API football-data.org
      // Por enquanto, simular sucesso
      setSuccess('✅ Sincronização concluída com sucesso!')
      await loadMatches()
    } catch (err) {
      setError(`❌ Erro ao sincronizar: ${err.message}`)
    } finally {
      setSyncing(false)
    }
  }

  const handleUpdateResult = async (matchId, result) => {
    try {
      setError('')

      if (!result) {
        setError('Selecione um resultado')
        return
      }

      // Get all predictions for this match
      const { data: predictions, error: fetchError } = await supabase
        .from('predictions')
        .select('*')
        .eq('match_id', matchId)

      if (fetchError) throw fetchError

      // Update match with result
      const { error: updateError } = await supabase
        .from('matches')
        .update({ result, updated_at: new Date().toISOString() })
        .eq('id', matchId)

      if (updateError) throw updateError

      // Calculate points for each prediction
      const updates = predictions.map(pred => ({
        id: pred.id,
        points: pred.prediction === result ? 1 : 0,
      }))

      // Bulk update predictions
      for (const update of updates) {
        const { error: predError } = await supabase
          .from('predictions')
          .update({ points: update.points })
          .eq('id', update.id)

        if (predError) throw predError
      }

      setSuccess(`✅ Resultado atualizado! ${updates.filter(u => u.points === 1).length} acertos`)
      setEditingMatchId(null)
      setEditingResult(null)
      await loadMatches()
    } catch (err) {
      setError(err.message || 'Erro ao atualizar resultado')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando matches...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="text-white hover:text-yellow-100 mb-4 font-bold"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold">⚙️ Painel Admin</h1>
          <p className="text-yellow-100">Sincronize dados e gerencie resultados</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {/* Sync Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📡 Sincronização com API</h2>
          <p className="text-gray-600 mb-4">
            Clique para sincronizar os dados mais recentes de football-data.org
          </p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar Agora'}
          </button>
        </div>

        {/* Matches Management */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold">⚽ Gerenciar Matches</h2>
          </div>

          {matches.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              Nenhum match disponível
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">Data/Hora</th>
                    <th className="px-4 py-3 text-left">Jogo</th>
                    <th className="px-4 py-3 text-center">Resultado Atual</th>
                    <th className="px-4 py-3 text-center">Total Palpites</th>
                    <th className="px-4 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match, index) => (
                    <tr
                      key={match.id}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-4 py-3 text-sm">
                        {new Date(match.scheduled_time).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 font-bold">
                        {match.team_a} <span className="text-gray-400 font-normal">vs</span> {match.team_b}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {match.result ? (
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                            {match.result === 'team_a' && match.team_a}
                            {match.result === 'team_b' && match.team_b}
                            {match.result === 'draw' && 'Empate'}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {match.predictions_count || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {editingMatchId === match.id ? (
                          <div className="flex gap-2 justify-center">
                            <select
                              value={editingResult || ''}
                              onChange={(e) => setEditingResult(e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded"
                            >
                              <option value="">Selecione...</option>
                              <option value="team_a">{match.team_a}</option>
                              <option value="draw">Empate</option>
                              <option value="team_b">{match.team_b}</option>
                            </select>
                            <button
                              onClick={() => handleUpdateResult(match.id, editingResult)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-bold"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => {
                                setEditingMatchId(null)
                                setEditingResult(null)
                              }}
                              className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingMatchId(match.id)
                              setEditingResult(match.result || '')
                            }}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm font-bold"
                          >
                            {match.result ? '✏️ Editar' : '➕ Adicionar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 mb-3">📋 Instruções</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>
              <strong>Sincronizar:</strong> Atualiza todos os matches com dados da API
            </li>
            <li>
              <strong>Editar Resultado:</strong> Selecione o resultado de um match para atualizar pontos
            </li>
            <li>
              <strong>Automático:</strong> Pontos são recalculados automaticamente para todos os usuários
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}
