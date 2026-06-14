import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Home() {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { path: '/', icon: '🏠', label: 'Início' },
    { path: '/matches', icon: '⚽', label: 'Jogos' },
    { path: '/ranking', icon: '🏆', label: 'Ranking' },
    { path: '/leagues', icon: '👥', label: 'Ligas' },
  ]

  const cards = [
    { path: '/matches', icon: '⚽', title: 'Palpites do Dia', desc: 'Veja os jogos e faça seus palpites', color: 'btn-primary' },
    { path: '/ranking', icon: '🏆', title: 'Ranking', desc: 'Veja como você está na classificação', color: 'btn-blue' },
    { path: '/history', icon: '📋', title: 'Histórico', desc: 'Seus palpites anteriores e resultados', color: 'btn-blue' },
    { path: '/leagues', icon: '👥', title: 'Minhas Ligas', desc: 'Crie ou entre em ligas com amigos', color: 'btn-purple' },
    { path: '/stats', icon: '📊', title: 'Estatísticas', desc: 'Taxa de acerto e streak', color: 'btn-indigo' },
  ]

  return (
    <div className="min-h-screen page-bg pb-16 md:pb-0">
      <header className="header-gradient text-white p-3 md:p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-3xl font-bold tracking-tight">Chutaço</h1>
            <p className="text-green-100 text-xs md:text-sm">Palpites para Copa 2026</p>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="text-right">
              <p className="font-bold text-sm md:text-base">{user?.username}</p>
              {user?.isAdmin && <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded font-bold">Admin</span>}
            </div>
            <button onClick={toggle} className="bg-white/20 hover:bg-white/30 text-white font-bold py-1.5 md:py-2 px-2 md:px-3 rounded-lg transition text-sm" title="Alternar tema">
              {dark ? '☀️' : '🌙'}
            </button>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 md:py-2 px-3 md:px-4 rounded-lg transition text-sm shadow">
              Sair
            </button>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 z-50 md:hidden shadow-lg dark:bg-gray-800/95 dark:border-gray-700">
        <div className="flex justify-around items-center h-14">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center px-3 py-1 rounded-lg transition ${
                location.pathname === item.path
                  ? 'text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-3 md:p-4">
        {/* Welcome Section */}
        <div className="card-accent mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🎯</span>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Bem-vindo ao Chutaço!</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            Faça seus palpites, acumule pontos e compita com amigos. Quem será o campeão dos palpites?
          </p>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card text-center py-4">
            <p className="text-2xl font-bold text-green-600">104</p>
            <p className="text-xs text-gray-500">Jogos</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-2xl font-bold text-blue-600">1</p>
            <p className="text-xs text-gray-500">Ligas</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-2xl font-bold text-purple-600">?</p>
            <p className="text-xs text-gray-500">Pontos</p>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {cards.map(card => (
            <div
              key={card.path}
              onClick={() => navigate(card.path)}
              className="card cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="text-3xl mb-3">{card.icon}</div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">{card.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{card.desc}</p>
              <button className={`${card.color} w-full text-sm`}>
                Acessar
              </button>
            </div>
          ))}

          {user?.isAdmin && (
            <div
              onClick={() => navigate('/admin')}
              className="card cursor-pointer border-2 border-yellow-400 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="text-3xl mb-3">⚙️</div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Painel Admin</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Sincronizar dados e gerenciar matches</p>
              <button className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-bold py-2.5 px-5 rounded-lg transition w-full text-sm shadow-md">
                Acessar
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
