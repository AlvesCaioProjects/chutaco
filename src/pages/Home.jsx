import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Chutaço</h1>
            <p className="text-green-100">Palpites para Copa 2026</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-bold">{user?.username}</p>
              {user?.isAdmin && <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded">Admin</span>}
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {/* Matches Card */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/matches')}>
            <div className="text-3xl mb-2">⚽</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Palpites do Dia</h2>
            <p className="text-gray-600 mb-4">Veja os jogos de hoje e faça seus palpites</p>
            <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg w-full transition">
              Ver Matches
            </button>
          </div>

          {/* Ranking Card */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/ranking')}>
            <div className="text-3xl mb-2">🏆</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Ranking</h2>
            <p className="text-gray-600 mb-4">Veja como você está na classificação geral</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg w-full transition">
              Ver Ranking
            </button>
          </div>

          {/* History Card */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/history')}>
            <div className="text-3xl mb-2">📋</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Histórico</h2>
            <p className="text-gray-600 mb-4">Veja seus palpites anteriores e resultados</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg w-full transition">
              Ver Histórico
            </button>
          </div>

          {/* Leagues Card */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/leagues')}>
            <div className="text-3xl mb-2">👥</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Minhas Ligas</h2>
            <p className="text-gray-600 mb-4">Crie ou entre em ligas com amigos</p>
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg w-full transition">
              Ver Ligas
            </button>
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="text-3xl mb-2">📊</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Minhas Estatísticas</h2>
            <p className="text-gray-600 mb-4">Veja sua taxa de acerto e streak</p>
            <button disabled className="bg-gray-400 text-white font-bold py-2 px-4 rounded-lg w-full cursor-not-allowed">
              Em Breve
            </button>
          </div>

          {/* Admin Panel Card */}
          {user?.isAdmin && (
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-2 border-yellow-400 cursor-pointer" onClick={() => navigate('/admin')}>
              <div className="text-3xl mb-2">⚙️</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Painel Admin</h2>
              <p className="text-gray-600 mb-4">Sincronizar dados e gerenciar matches</p>
              <button className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg w-full transition">
                Ir para Admin
              </button>
            </div>
          )}
        </div>

        {/* Quick Info */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📢 Bem-vindo ao Chutaço!</h2>
          <p className="text-gray-600 mb-4">
            Este é um jogo de palpites interativo para a Copa do Mundo 2026. Faça seus palpites sobre quem vencerá cada partida,
            acumule pontos e compita no ranking global ou em ligas privadas com seus amigos.
          </p>
          <ul className="text-gray-600 space-y-2">
            <li>✅ Faça palpites até 5 minutos antes de cada jogo</li>
            <li>✅ Ganhe 1 ponto por cada acerto</li>
            <li>✅ Suba no ranking e compare com seus amigos</li>
            <li>✅ Acompanhe seu histórico e estatísticas</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
