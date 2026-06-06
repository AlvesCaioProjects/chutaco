import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import MatchCard from '../components/MatchCard'

export default function Matches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadMatches()
  }, [])

  const loadMatches = async () => {
    try {
      setError('')
      setLoading(true)

      // Fetch matches from today and upcoming
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .gte('scheduled_time', new Date().toISOString())
        .order('scheduled_time', { ascending: true })
        .limit(50)

      if (matchesError) throw matchesError

      // Fetch user's predictions for these matches
      if (matchesData && matchesData.length > 0) {
        const matchIds = matchesData.map(m => m.id)
        const { data: predictionsData, error: predictionsError } = await supabase
          .from('predictions')
          .select('*')
          .eq('user_id', user.id)
          .in('match_id', matchIds)

        if (predictionsError) throw predictionsError

        // Merge predictions with matches
        const matchesWithPredictions = matchesData.map(match => {
          const prediction = predictionsData?.find(p => p.match_id === match.id)
          return { ...match, userPrediction: prediction }
        })

        setMatches(matchesWithPredictions)
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

      const userPrediction = matches.find(m => m.id === matchId)?.userPrediction

      if (userPrediction) {
        // Update existing prediction
        const { error: updateError } = await supabase
          .from('predictions')
          .update({ prediction, updated_at: new Date().toISOString() })
          .eq('id', userPrediction.id)

        if (updateError) throw updateError
      } else {
        // Insert new prediction
        const { error: insertError } = await supabase
          .from('predictions')
          .insert([
            {
              user_id: user.id,
              match_id: matchId,
              prediction,
              points: 0,
            },
          ])

        if (insertError) throw insertError
      }

      // Reload matches
      await loadMatches()
    } catch (err) {
      setError(err.message || 'Erro ao salvar palpite')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando matches...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="text-white hover:text-green-100 mb-4 font-bold"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold">⚽ Palpites do Dia</h1>
          <p className="text-green-100">Faça seus palpites até 5 minutos antes do jogo</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {matches.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg">Nenhum jogo disponível no momento</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map(match => (
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
