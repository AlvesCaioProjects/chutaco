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
  const [syncLogs, setSyncLogs] = useState([])
  const [lastSync, setLastSync] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadMatches()
    loadSyncLogs()
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

  const loadSyncLogs = async () => {
    try {
      const { data, error: logError } = await supabase
        .from('sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (logError) throw logError
      setSyncLogs(data || [])

      const last = data?.[0]
      if (last) setLastSync(last.created_at)
    } catch (err) {
      console.error('Error loading sync logs:', err)
    }
  }

  const handleUpdateResult = async (matchId, result) => {
    try {
      setError('')

      if (!result) {
        setError('Selecione um resultado')
        return
      }

      const { data: predictions, error: fetchError } = await supabase
        .from('predictions')
        .select('*')
        .eq('match_id', matchId)

      if (fetchError) throw fetchError

      const { error: updateError } = await supabase
        .from('matches')
        .update({ result, updated_at: new Date().toISOString() })
        .eq('id', matchId)

      if (updateError) throw updateError

      const updates = predictions.map(pred => ({
        id: pred.id,
        points: pred.prediction === result ? 1 : 0,
      }))

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
          <h2 className="text-xl font-bold mb-4">📡 Sincronização football-data.org</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Última sincronização</p>
              <p className="text-lg font-bold">
                {lastSync
                  ? new Date(lastSync).toLocaleString('pt-BR')
                  : 'Nunca'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Total de logs</p>
              <p className="text-lg font-bold">{syncLogs.length}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Último status</p>
              <p className="text-lg font-bold">
                {syncLogs[0]?.status === 'success' ? '✅ Sucesso' : syncLogs[0]?.status === 'error' ? '❌ Erro' : '-'}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 mb-2">⚡ Sincronizar via script</h3>
            <p className="text-sm text-blue-800 mb-3">
              A API football-data.org não permite chamadas diretas do navegador.
              Rode o comando abaixo no terminal para sincronizar:
            </p>
            <div className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm font-mono mb-3">
              node scripts/sync.cjs --api-key=SUA_CHAVE_AQUI
            </div>
            <p className="text-xs text-blue-700">
              Ou edite o <code>.env.local</code> com <code>FOOTBALL_DATA_API_KEY=sua_chave</code> e rode apenas <code>node scripts/sync.cjs</code>
            </p>
          </div>
        </div>

        {/* Sync Logs */}
        {syncLogs.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold">📝 Histórico de Sincronização</h2>
            </div>
            <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
              {syncLogs.map(log => (
                <div key={log.id} className="px-4 py-2 flex items-center gap-3 text-sm">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    log.status === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {log.status === 'success' ? '✅' : '❌'}
                  </span>
                  <span className="text-gray-600 flex-1">{log.message}</span>
                  <span className="text-gray-400 text-xs">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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
                    <th className="hidden sm:table-cell px-2 md:px-4 py-3 text-left text-sm">Data</th>
                    <th className="px-2 md:px-4 py-3 text-left text-sm">Jogo</th>
                    <th className="px-2 md:px-4 py-3 text-center text-sm">Resultado</th>
                    <th className="hidden md:table-cell px-2 md:px-4 py-3 text-center text-sm">Palpites</th>
                    <th className="px-2 md:px-4 py-3 text-center text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match, index) => (
                    <tr
                      key={match.id}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="hidden sm:table-cell px-2 md:px-4 py-3 text-xs md:text-sm">
                        {new Date(match.scheduled_time).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-2 md:px-4 py-3 font-bold text-sm md:text-base">
                        <span className="md:hidden">{match.team_a.slice(0, 4)}...</span>
                        <span className="hidden md:inline">{match.team_a}</span>
                        <span className="text-gray-400 font-normal text-xs md:text-sm"> vs </span>
                        <span className="md:hidden">{match.team_b.slice(0, 4)}...</span>
                        <span className="hidden md:inline">{match.team_b}</span>
                      </td>
                      <td className="px-2 md:px-4 py-3 text-center">
                        {match.result ? (
                          <span className="bg-green-100 text-green-800 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-bold">
                            {match.result === 'team_a' && (match.team_a.length > 8 ? match.team_a.slice(0, 8) + '...' : match.team_a)}
                            {match.result === 'team_b' && (match.team_b.length > 8 ? match.team_b.slice(0, 8) + '...' : match.team_b)}
                            {match.result === 'draw' && 'Empate'}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="hidden md:table-cell px-2 md:px-4 py-3 text-center">
                        <span className="bg-blue-100 text-blue-800 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm">
                          {match.predictions_count || 0}
                        </span>
                      </td>
                      <td className="px-2 md:px-4 py-3 text-center">
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
              <strong>1. API Key:</strong> Coloque a chave no <code>.env.local</code> ou passe via <code>--api-key</code>
            </li>
            <li>
              <strong>2. Sincronizar:</strong> Rode <code>npm run sync</code> no terminal para buscar matches da API
            </li>
            <li>
              <strong>3. Editar Resultado:</strong> Use a tabela abaixo para ajustar manualmente resultados
            </li>
            <li>
              <strong>Automático:</strong> Pontos são recalculados automaticamente ao editar um resultado
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}
