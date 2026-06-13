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

  useEffect(() => {
    loadLeagues()
  }, [])

  const loadLeagues = async () => {
    try {
      setError('')
      setLoading(true)

      const { data: owned, error: ownedError } = await supabase
        .from('leagues')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (ownedError) throw ownedError

      const { data: memberships, error: membershipsError } = await supabase
        .from('league_members')
        .select('league:league_id(*)')
        .eq('user_id', user.id)

      if (membershipsError) throw membershipsError

      const memberLeagues = (memberships || [])
        .map(m => m.league)
        .filter(l => l && !owned?.some(o => o.id === l.id))

      const all = [...(owned || []), ...memberLeagues]
      setLeagues(all)
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

    if (!leagueName.trim()) {
      setError('Digite um nome para a liga')
      return
    }

    try {
      const { data: league, error: createError } = await supabase
        .from('leagues')
        .insert({ name: leagueName.trim(), owner_id: user.id })
        .select()
        .single()

      if (createError) throw createError

      await supabase
        .from('league_members')
        .insert({ league_id: league.id, user_id: user.id })

      setSuccess(`Liga "${league.name}" criada! Código: ${league.code}`)
      setShowCreate(false)
      setLeagueName('')
      await loadLeagues()
    } catch (err) {
      setError(err.message || 'Erro ao criar liga')
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!joinCode.trim()) {
      setError('Digite o código da liga')
      return
    }

    try {
      const { data: league, error: findError } = await supabase
        .from('leagues')
        .select('*')
        .eq('code', joinCode.trim())
        .single()

      if (findError || !league) {
        throw new Error('Código inválido')
      }

      const alreadyMember = await supabase
        .from('league_members')
        .select('*')
        .eq('league_id', league.id)
        .eq('user_id', user.id)
        .single()

      if (alreadyMember.data) {
        throw new Error('Você já está nessa liga')
      }

      const { error: joinError } = await supabase
        .from('league_members')
        .insert({ league_id: league.id, user_id: user.id })

      if (joinError) throw joinError

      setSuccess(`Você entrou na liga "${league.name}"!`)
      setShowJoin(false)
      setJoinCode('')
      await loadLeagues()
    } catch (err) {
      setError(err.message || 'Erro ao entrar na liga')
    }
  }

  const handleLeave = async (leagueId) => {
    setError('')
    setSuccess('')

    try {
      const { error: leaveError } = await supabase
        .from('league_members')
        .delete()
        .eq('league_id', leagueId)
        .eq('user_id', user.id)

      if (leaveError) throw leaveError

      if (selectedLeague?.id === leagueId) {
        setSelectedLeague(null)
        setRanking([])
      }

      setSuccess('Você saiu da liga')
      await loadLeagues()
    } catch (err) {
      setError(err.message || 'Erro ao sair da liga')
    }
  }

  const handleDelete = async (leagueId) => {
    setError('')
    setSuccess('')

    try {
      const { error: deleteError } = await supabase
        .from('leagues')
        .delete()
        .eq('id', leagueId)
        .eq('owner_id', user.id)

      if (deleteError) throw deleteError

      if (selectedLeague?.id === leagueId) {
        setSelectedLeague(null)
        setRanking([])
      }

      setSuccess('Liga excluída')
      await loadLeagues()
    } catch (err) {
      setError(err.message || 'Erro ao excluir liga')
    }
  }

  const loadRanking = async (league) => {
    setSelectedLeague(league)
    setRankingLoading(true)
    setError('')

    try {
      const { data, error: rankError } = await supabase
        .from('league_rankings')
        .select('*')
        .eq('league_id', league.id)
        .order('total_points', { ascending: false })

      if (rankError) throw rankError
      setRanking(data || [])
    } catch (err) {
      setError(err.message || 'Erro ao carregar ranking')
    } finally {
      setRankingLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando ligas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="text-white hover:text-purple-100 mb-4 font-bold"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold">👥 Minhas Ligas</h1>
          <p className="text-purple-100">Crie ou entre em ligas com amigos</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
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

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => { setShowCreate(true); setShowJoin(false) }}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            ✨ Criar Liga
          </button>
          <button
            onClick={() => { setShowJoin(true); setShowCreate(false) }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            🔑 Entrar em Liga
          </button>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Nova Liga</h2>
            <form onSubmit={handleCreate}>
              <input
                type="text"
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                placeholder="Nome da liga"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg"
                >
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Join Modal */}
        {showJoin && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Entrar em Liga</h2>
            <form onSubmit={handleJoin}>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Código da liga"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setShowJoin(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Leagues List */}
        {leagues.length === 0 && !showCreate && !showJoin ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg mb-2">Você não está em nenhuma liga</p>
            <p className="text-gray-500">Crie uma liga ou entre com um código</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leagues.map(league => {
              const isOwner = league.owner_id === user.id
              return (
                <div
                  key={league.id}
                  className={`bg-white rounded-lg shadow p-4 border-l-4 cursor-pointer transition ${
                    selectedLeague?.id === league.id
                      ? 'border-l-purple-500'
                      : 'border-l-gray-300'
                  }`}
                  onClick={() => loadRanking(league)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{league.name}</h3>
                      {isOwner && (
                        <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">
                          Dono
                        </span>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Código: <span className="font-mono font-bold">{league.code}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {isOwner ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(league.id) }}
                          className="text-red-500 hover:text-red-700 text-sm font-bold"
                        >
                          Excluir
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleLeave(league.id) }}
                          className="text-red-500 hover:text-red-700 text-sm font-bold"
                        >
                          Sair
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* League Ranking */}
        {selectedLeague && (
          <div className="mt-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🏆 Ranking: {selectedLeague.name}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Compartilhe o código <span className="font-mono font-bold">{selectedLeague.code}</span> para convidar amigos
            </p>

            {rankingLoading ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : ranking.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">Nenhum palpite na liga ainda</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-200 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Usuário</th>
                      <th className="px-4 py-3 text-center">Pontos</th>
                      <th className="px-4 py-3 text-center">Taxa</th>
                      <th className="px-4 py-3 text-center">Streak</th>
                      <th className="px-4 py-3 text-center">Palpites</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((r, i) => (
                      <tr
                        key={r.id}
                        className={`border-b ${
                          r.id === user.id ? 'bg-purple-50 font-bold' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className="font-bold">#{i + 1}</span>
                        </td>
                        <td className="px-4 py-3">
                          {r.username}
                          {r.id === user.id && (
                            <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded ml-2">Você</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-bold">{r.total_points}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                            {r.accuracy_rate?.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">{r.current_streak}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{r.total_predictions}</td>
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
