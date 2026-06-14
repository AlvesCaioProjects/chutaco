import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import MatchCard from '../components/MatchCard'

function formatDate(date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function toLocalDateStr(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function Matches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { loadMatches() }, [])

  const loadMatches = async () => {
    try {
      setError('')
      setLoading(true)
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .order('scheduled_time', { ascending: true })
        .limit(100)

      if (matchesError) throw matchesError

      if (matchesData && matchesData.length > 0) {
        const matchIds = matchesData.map(m => m.id)
        const { data: predictionsData, error: predictionsError } = await supabase
          .from('predictions')
          .select('*')
          .eq('user_id', user.id)
          .in('match_id', matchIds)

        if (predictionsError) throw predictionsError

        setMatches(matchesData.map(match => ({
          ...match,
          userPrediction: predictionsData?.find(p => p.match_id === match.id) || null,
        })))
      } else {
        setMatches([])
      }
    } catch (err) {
      setError(err.message || 'Erro ao carregar matches')
    } finally {
      setLoading(false)
    }
  }

  const handlePredictionChange = async (matchId, prediction) => {
    try {
      setError('')
      const match = matches.find(m => m.id === matchId)
      const userPrediction = match?.userPrediction

      if (userPrediction) {
        const { error: updateError } = await supabase
          .from('predictions')
          .update({ prediction, updated_at: new Date().toISOString() })
          .eq('id', userPrediction.id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('predictions')
          .insert([{ user_id: user.id, match_id: matchId, prediction, points: 0 }])
        if (insertError) throw insertError
      }

      await loadMatches()
    } catch (err) {
      setError(err.message || 'Erro ao salvar palpite')
    }
  }

  const filteredMatches = matches.filter(m => {
    const matchDate = toLocalDateStr(new Date(m.scheduled_time))
    return matchDate === toLocalDateStr(selectedDate)
  })

  const goToPrevDay = () => {
    const prev = new Date(selectedDate)
    prev.setDate(prev.getDate() - 1)
    setSelectedDate(prev)
  }

  const goToNextDay = () => {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + 1)
    setSelectedDate(next)
  }

  const goToToday = () => setSelectedDate(new Date())

  const isToday = toLocalDateStr(selectedDate) === toLocalDateStr(new Date())

  if (loading) {
    return (
      <div className="min-h-screen page-bg p-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando matches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen page-bg">
      <header className="header-gradient text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate('/')} className="text-white hover:text-green-100 mb-3 font-bold text-sm">
            ← Voltar
          </button>
          <h1 className="text-2xl md:text-3xl font-bold">⚽ Palpites do Dia</h1>
          <p className="text-green-100 text-sm">Faça seus palpites até 5 minutos antes do jogo</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPrevDay}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-xl"
              title="Dia anterior"
            >
              ◀
            </button>

            <div className="text-center flex-1 px-2">
              <p className="font-bold text-gray-800 dark:text-gray-100 text-sm md:text-base">
                {formatDate(selectedDate)}
              </p>
              {!isToday && (
                <button
                  onClick={goToToday}
                  className="text-xs text-green-600 hover:text-green-700 font-bold mt-1"
                >
                  Ir para hoje
                </button>
              )}
            </div>

            <button
              onClick={goToNextDay}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-xl"
              title="Dia seguinte"
            >
              ▶
            </button>
          </div>

          <div className="mt-3 text-center">
            <span className="text-xs text-gray-500">
              {filteredMatches.length} {filteredMatches.length === 1 ? 'jogo' : 'jogos'}
            </span>
          </div>
        </div>

        {filteredMatches.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">Nenhum jogo nesta data</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">Use as setas para navegar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                onPredictionChange={handlePredictionChange}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
