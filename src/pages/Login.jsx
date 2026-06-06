import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { success, error: loginError } = await login(username, password)

    if (success) {
      navigate('/')
    } else {
      setError(loginError)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-yellow-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Chutaço</h1>
        <p className="text-center text-gray-600 mb-8">Palpites para Copa 2026</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Digite seu usuário"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Digite sua senha"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Não tem conta?{' '}
            <Link to="/register" className="text-green-600 hover:text-green-700 font-bold">
              Cadastre-se
            </Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-gray-600 mb-2">
            <strong>Demo:</strong> Use estas credenciais para testar:
          </p>
          <p className="text-sm text-gray-600">Usuário: <code className="bg-blue-100 px-2 py-1 rounded">admin</code></p>
          <p className="text-sm text-gray-600">Senha: <code className="bg-blue-100 px-2 py-1 rounded">admin123</code></p>
        </div>
      </div>
    </div>
  )
}
