import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function Admin() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [syncStatus, setSyncStatus] = useState(null)
  const [syncLogs, setSyncLogs] = useState([])
  const [activeTab, setActiveTab] = useState('matches')
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadMatches()
    loadSyncStatus()
  }, [])

  const loadMatches = async () => {
    try {
      setError('')
      setLoading(true)

      const { data, error: mErr } = await supabase
        .from('matches')
        .select('*')
        .order('scheduled_time', { ascending: false })

      if (mErr) throw mErr
      setMatches(data || [])
    } catch (err) {
      setError(err.message || 'Erro ao carregar partidas')
    } finally {
      setLoading(false)
    }
  }

  const loadSyncStatus = async () => {
    try {
      const { data: syncCount } = await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .not('external_id', 'is', null)

      const { data: config } = await supabase
        .from('app_config')
        .select('*')
        .eq('key', 'last_sync')
        .maybeSingle()

      const { data: logs } = await supabase
        .from('sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      setSyncStatus({ total: syncCount?.count || 0, lastSync: config?.value || null })
      setSyncLogs(logs || [])
    } catch { }
  }

  const handleResultSave = async (matchId, result) => {
    try {
      setError('')
      setSuccess('')
      const { error: uErr } = await supabase
        .from('matches')
        .update({ result })
        .eq('id', matchId)

      if (uErr) throw uErr

      setSuccess(`Resultado atualizado!`)
      await loadMatches()
    } catch (err) {
      setError(err.message || 'Erro ao salvar resultado')
    }
  }

  const handleClearResult = async (matchId) => {
    try {
      setError('')
      setSuccess('')

      const match = matches.find(m => m.id === matchId)
      if (match?.result != null) {
        const { error: pErr } = await supabase
          .from('predictions')
          .update({ points: 0, processed: false })
          .eq('match_id', matchId)

        if (pErr) throw pErr
      }

      const { error: uErr } = await supabase
        .from('matches')
        .update({ result: null })
        .eq('id', matchId)

      if (uErr) throw uErr

      setSuccess(`Resultado removido!`)
      await loadMatches()
    } catch (err) {
      setError(err.message || 'Erro ao remover resultado')
    }
  }

  if (!user?.isAdmin && !user?.is_admin) {
    return (
      <div className="min-h-screen page-bg p-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-red-500 font-bold">Acesso restrito a administradores</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen page-bg">
      <header className="bg-gradient-to-r from-gray-800 to-gray-700 dark:from-gray-900 dark:to-black text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => navigate('/')} className="text-white hover:text-gray-300 mb-3 font-bold text-sm">← Voltar</button>
          <h1 className="text-2xl md:text-3xl font-bold">⚙️ Admin</h1>
          <p className="text-gray-300 text-sm">Gerenciamento do sistema</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">{success}</div>}

        <div className="flex gap-2 mb-6 flex-wrap">
          {['matches', 'sync', 'logs'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                activeTab === tab ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab === 'matches' ? 'Partidas' : tab === 'sync' ? 'Sync Status' : 'Logs'}
            </button>
          ))}
        </div>

        {activeTab === 'matches' && (
          <div>
            <div className="card p-0 overflow-hidden mb-6">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-600">Data</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-gray-600">Partida</th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-gray-600">Resultado</th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-gray-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map(m => (
                      <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(m.scheduled_time).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-3 py-3 text-sm font-medium whitespace-nowrap">{m.team_a} vs {m.team_b}</td>
                        <td className="px-3 py-3 text-center">
                          {m.result ? (
                            <span className="badge-green text-xs whitespace-nowrap">
                              {m.result === 'team_a' ? m.team_a : m.result === 'team_b' ? m.team_b : 'Empate'}
                            </span>
                          ) : (
                            <span className="badge-red text-xs">Pendente</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1 justify-center flex-wrap">
                            {['team_a', 'draw', 'team_b'].map(r => (
                              <button
                                key={r}
                                onClick={() => handleResultSave(m.id, r === 'draw' ? 'draw' : r)}
                                className={`text-xs px-2 py-1 rounded transition ${
                                  m.result === r
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {r === 'team_a' ? m.team_a.slice(0, 3) : r === 'team_b' ? m.team_b.slice(0, 3) : 'Emp'}
                              </button>
                            ))}
                            {m.result && (
                              <button
                                onClick={() => handleClearResult(m.id)}
                                className="text-xs px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200"
                              >
                                X
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sync' && (
          <div className="card mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4">📡 Status da Sincronização</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{syncStatus?.total || 0}</p>
                <p className="text-xs text-gray-600">Partidas sincronizadas</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">{matches.length}</p>
                <p className="text-xs text-gray-600">Total de partidas</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{matches.filter(m => m.result).length}</p>
                <p className="text-xs text-gray-600">Com resultado</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{matches.filter(m => !m.result).length}</p>
                <p className="text-xs text-gray-600">Sem resultado</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-600">
                Última sincronização: {syncStatus?.lastSync ? new Date(syncStatus.lastSync).toLocaleString('pt-BR') : 'Nunca'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Para sincronizar, execute: <span className="font-mono font-bold">npm run sync</span>
              </p>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="card mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-4">📋 Logs de Sincronização</h3>
            {syncLogs.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Nenhum log encontrado</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {syncLogs.map(log => (
                  <div key={log.id} className={`p-3 rounded-lg text-xs ${log.status === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex justify-between items-start">
                      <span className="font-bold">{log.status === 'success' ? '✅ Sucesso' : '❌ Erro'}</span>
                      <span className="text-gray-400">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                    {log.message && <p className="mt-1 text-gray-600">{log.message}</p>}
                    {log.details && <pre className="mt-1 text-gray-400 text-xs whitespace-pre-wrap max-h-20 overflow-y-auto">{log.details}</pre>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
