import { useState, useEffect } from 'react'

export default function MatchCard({ match, onPredictionChange }) {
  const [isBlocked, setIsBlocked] = useState(false)
  const [timeUntilStart, setTimeUntilStart] = useState('')
  const [selectedPrediction, setSelectedPrediction] = useState(
    match.userPrediction?.prediction || null
  )

  // Check if match is blocked (5 minutes before start)
  useEffect(() => {
    const checkBlockStatus = () => {
      const now = new Date()
      const matchTime = new Date(match.scheduled_time)
      const blockTime = new Date(matchTime.getTime() - 5 * 60 * 1000) // 5 minutes before

      if (now >= blockTime) {
        setIsBlocked(true)
      }

      // Calculate time until start
      const diffMs = matchTime - now
      if (diffMs > 0) {
        const hours = Math.floor(diffMs / 3600000)
        const minutes = Math.floor((diffMs % 3600000) / 60000)
        setTimeUntilStart(`${hours}h ${minutes}m`)
      } else {
        setTimeUntilStart('Em andamento')
      }
    }

    checkBlockStatus()
    const interval = setInterval(checkBlockStatus, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [match.scheduled_time])

  const handlePredictionSelect = (prediction) => {
    if (!isBlocked) {
      setSelectedPrediction(prediction)
      onPredictionChange(match.id, prediction)
    }
  }

  const getResultColor = () => {
    if (!match.result) return 'bg-white'
    if (match.userPrediction?.points === 1) return 'bg-green-50 border-green-200'
    return 'bg-red-50 border-red-200'
  }

  return (
    <div className={`${getResultColor()} border-2 rounded-lg shadow p-6 transition`}>
      {/* Match Info */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <div className="text-2xl">🕐</div>
            <div>
              <p className="text-sm text-gray-500">
                {new Date(match.scheduled_time).toLocaleString('pt-BR')}
              </p>
              <p className={`text-sm font-bold ${match.result ? 'text-gray-600' : 'text-green-600'}`}>
                {timeUntilStart}
              </p>
            </div>
          </div>
        </div>

        {/* Result Badge */}
        {match.result && (
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              match.userPrediction?.points === 1
                ? 'bg-green-200 text-green-800'
                : 'bg-red-200 text-red-800'
            }`}>
              {match.userPrediction?.points === 1 ? '✅ +1 Ponto' : '❌ 0 Pontos'}
            </span>
          </div>
        )}
      </div>

      {/* Teams */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Team A */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-lg font-bold text-gray-800 mb-2">{match.team_a}</p>
          <div className="flex justify-center">
            <button
              onClick={() => handlePredictionSelect('team_a')}
              disabled={isBlocked}
              className={`px-4 py-2 rounded-lg font-bold transition ${
                selectedPrediction === 'team_a'
                  ? 'bg-green-600 text-white'
                  : isBlocked
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-green-200'
              }`}
            >
              Vitória
            </button>
          </div>
          {match.result === 'team_a' && (
            <p className="text-xs text-green-600 font-bold mt-2">⭐ Resultado</p>
          )}
        </div>

        {/* Draw */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-lg font-bold text-gray-800 mb-2">-</p>
          <div className="flex justify-center">
            <button
              onClick={() => handlePredictionSelect('draw')}
              disabled={isBlocked}
              className={`px-4 py-2 rounded-lg font-bold transition ${
                selectedPrediction === 'draw'
                  ? 'bg-yellow-600 text-white'
                  : isBlocked
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-yellow-200'
              }`}
            >
              Empate
            </button>
          </div>
          {match.result === 'draw' && (
            <p className="text-xs text-green-600 font-bold mt-2">⭐ Resultado</p>
          )}
        </div>

        {/* Team B */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-lg font-bold text-gray-800 mb-2">{match.team_b}</p>
          <div className="flex justify-center">
            <button
              onClick={() => handlePredictionSelect('team_b')}
              disabled={isBlocked}
              className={`px-4 py-2 rounded-lg font-bold transition ${
                selectedPrediction === 'team_b'
                  ? 'bg-green-600 text-white'
                  : isBlocked
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-green-200'
              }`}
            >
              Vitória
            </button>
          </div>
          {match.result === 'team_b' && (
            <p className="text-xs text-green-600 font-bold mt-2">⭐ Resultado</p>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="text-xs text-gray-500 text-center">
        {isBlocked && (
          <p className="text-red-600 font-bold">🔒 Jogo iniciado - Palpite bloqueado</p>
        )}
        {!isBlocked && selectedPrediction && (
          <p className="text-green-600">✅ Seu palpite foi salvo</p>
        )}
        {!isBlocked && !selectedPrediction && (
          <p className="text-yellow-600">Escolha uma opção para fazer seu palpite</p>
        )}
      </div>
    </div>
  )
}
