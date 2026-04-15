import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        console.log('AuthContext - Parsed user from localStorage:', parsedUser)
        console.log('AuthContext - User role:', parsedUser.role)
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      if (response.data.success) {
        const { token, user: userData } = response.data.data
        console.log('AuthContext - Login response userData:', userData)
        console.log('AuthContext - User role from login:', userData.role)
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
        return { success: true }
      }
      return { success: false, message: response.data.message }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' }
    }
  }

  const signup = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      if (response.data.success) {
        const { token, user: newUser } = response.data.data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(newUser))
        setUser(newUser)
        return { success: true }
      }
      return { success: false, message: response.data.message }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Signup failed' }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/login'
  }

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
