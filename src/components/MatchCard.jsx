import { useState, useEffect } from 'react'
import { getFlag } from '../lib/flags'

export default function MatchCard({ match, onPredictionChange }) {
  const [isBlocked, setIsBlocked] = useState(false)
  const [timeUntilStart, setTimeUntilStart] = useState('')
  const [selectedPrediction, setSelectedPrediction] = useState(
    match.userPrediction?.prediction || null
  )

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const matchTime = new Date(match.scheduled_time)
      const blockTime = new Date(matchTime.getTime() - 5 * 60 * 1000)

      if (now >= blockTime) setIsBlocked(true)

      const diffMs = matchTime - now
      if (diffMs > 0) {
        const hours = Math.floor(diffMs / 3600000)
        const minutes = Math.floor((diffMs % 3600000) / 60000)
        setTimeUntilStart(`${hours}h ${minutes}m`)
      } else {
        setTimeUntilStart('Em andamento')
      }
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [match.scheduled_time])

  const handlePredictionSelect = (prediction) => {
    if (!isBlocked) {
      setSelectedPrediction(prediction)
      onPredictionChange(match.id, prediction)
    }
  }

  const isCorrect = match.userPrediction?.points === 1

  return (
    <div className={`card ${match.result ? (isCorrect ? 'border-l-green-500' : 'border-l-red-500') : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🕐</span>
          <div>
            <p className="text-xs text-gray-500">
              {new Date(match.scheduled_time).toLocaleString('pt-BR')}
            </p>
            <p className={`text-xs font-bold ${match.result ? 'text-gray-500 dark:text-gray-400' : 'text-green-600'}`}>
              {timeUntilStart}
            </p>
          </div>
        </div>

        {match.result && (
          <span className={`badge-${isCorrect ? 'green' : 'red'}`}>
            {isCorrect ? '✅ +1 Ponto' : '❌ 0 Pontos'}
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4">
        {/* Team A */}
        <div className="text-center p-3 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm md:text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 truncate">{getFlag(match.team_a)} {match.team_a}</p>
          <button
            onClick={() => handlePredictionSelect('team_a')}
            disabled={isBlocked}
            className={`w-full px-3 md:px-4 py-2 rounded-lg font-bold text-sm transition ${
              selectedPrediction === 'team_a'
                ? 'bg-green-600 text-white shadow-md'
                : isBlocked
                  ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-green-200 dark:hover:bg-green-800 hover:text-green-800 dark:hover:text-green-200'
            }`}
          >
            Vitória
          </button>
          {match.result === 'team_a' && (
            <p className="text-xs text-green-600 font-bold mt-1">⭐ Resultado</p>
          )}
        </div>

        {/* Draw */}
        <div className="text-center p-3 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm md:text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">-</p>
          <button
            onClick={() => handlePredictionSelect('draw')}
            disabled={isBlocked}
            className={`w-full px-3 md:px-4 py-2 rounded-lg font-bold text-sm transition ${
              selectedPrediction === 'draw'
                ? 'bg-yellow-600 text-white shadow-md'
                : isBlocked
                  ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-yellow-200 dark:hover:bg-yellow-800 hover:text-yellow-800 dark:hover:text-yellow-200'
            }`}
          >
            Empate
          </button>
          {match.result === 'draw' && (
            <p className="text-xs text-green-600 font-bold mt-1">⭐ Resultado</p>
          )}
        </div>

        {/* Team B */}
        <div className="text-center p-3 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm md:text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 truncate">{getFlag(match.team_b)} {match.team_b}</p>
          <button
            onClick={() => handlePredictionSelect('team_b')}
            disabled={isBlocked}
            className={`w-full px-3 md:px-4 py-2 rounded-lg font-bold text-sm transition ${
              selectedPrediction === 'team_b'
                ? 'bg-green-600 text-white shadow-md'
                : isBlocked
                  ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-green-200 dark:hover:bg-green-800 hover:text-green-800 dark:hover:text-green-200'
            }`}
          >
            Vitória
          </button>
          {match.result === 'team_b' && (
            <p className="text-xs text-green-600 font-bold mt-1">⭐ Resultado</p>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="text-xs text-center">
        {isBlocked && (
          <p className="text-red-600 font-bold">🔒 Jogo iniciado — Palpite bloqueado</p>
        )}
        {!isBlocked && selectedPrediction && (
          <p className="text-green-600 font-bold">✅ Seu palpite foi salvo</p>
        )}
        {!isBlocked && !selectedPrediction && (
          <p className="text-yellow-600">Escolha uma opção para fazer seu palpite</p>
        )}
      </div>
    </div>
  )
}
