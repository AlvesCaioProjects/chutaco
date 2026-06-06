import { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-yellow-500 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Chutaço</h1>
        <p className="text-xl text-gray-600 mb-6">Palpites para Copa 2026</p>
        <button
          onClick={() => setCount(count + 1)}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition"
        >
          Cliques: {count}
        </button>
      </div>
    </div>
  )
}
