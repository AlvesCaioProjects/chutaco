import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'
import bcrypt from 'bcryptjs'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      } catch (err) {
        console.error('Error checking stored user:', err)
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [])

  const register = useCallback(async (username, password) => {
    setError(null)
    setLoading(true)
    try {
      // Validate input
      if (username.length < 3) {
        throw new Error('Username deve ter pelo menos 3 caracteres')
      }
      if (password.length < 6) {
        throw new Error('Senha deve ter pelo menos 6 caracteres')
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10)

      // Insert user into database
      const { data, error: dbError } = await supabase
        .from('users')
        .insert([
          {
            username,
            password_hash: passwordHash,
            is_admin: false,
          },
        ])
        .select()

      if (dbError) {
        if (dbError.message.includes('duplicate')) {
          throw new Error('Username já existe')
        }
        throw new Error(dbError.message || 'Erro ao registrar')
      }

      if (data && data.length > 0) {
        const newUser = { id: data[0].id, username: data[0].username }
        setUser(newUser)
        localStorage.setItem('user', JSON.stringify(newUser))
        localStorage.setItem('userId', data[0].id)
        return { success: true }
      }
    } catch (err) {
      const errorMsg = err.message || 'Erro ao registrar'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (username, password) => {
    setError(null)
    setLoading(true)
    try {
      // Fetch user from database
      const { data, error: dbError } = await supabase
        .from('users')
        .select('id, username, password_hash, is_admin')
        .eq('username', username)
        .single()

      if (dbError || !data) {
        throw new Error('Usuário ou senha inválidos')
      }

      // Compare password
      const passwordMatch = await bcrypt.compare(password, data.password_hash)

      if (!passwordMatch) {
        throw new Error('Usuário ou senha inválidos')
      }

      const userData = { id: data.id, username: data.username, isAdmin: data.is_admin }
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('userId', data.id)

      return { success: true }
    } catch (err) {
      const errorMsg = err.message || 'Erro ao fazer login'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('userId')
    setError(null)
  }, [])

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
