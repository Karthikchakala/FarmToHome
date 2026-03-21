import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { authAPI } from '../services/api'

const AuthDebug = () => {
  const { user, isAuthenticated, loading } = useAuth()
  const [localStorageData, setLocalStorageData] = useState({})
  const [tokenTest, setTokenTest] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    setLocalStorageData({ token, userData })
  }, [])

  const testToken = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setTokenTest('No token found')
      return
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/test-auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      })
      const result = await response.json()
      setTokenTest(JSON.stringify(result, null, 2))
    } catch (error) {
      setTokenTest('Error: ' + error.message)
    }
  }

  return (
    <div style={{ padding: '20px', background: '#f0f0f0', margin: '20px', borderRadius: '8px' }}>
      <h3>Auth Debug Information</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>AuthContext State:</strong>
        <ul>
          <li>Loading: {loading ? 'true' : 'false'}</li>
          <li>Is Authenticated: {isAuthenticated ? 'true' : 'false'}</li>
          <li>User: {user ? JSON.stringify(user, null, 2) : 'null'}</li>
        </ul>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>LocalStorage Data:</strong>
        <ul>
          <li>Token: {localStorageData.token ? 'exists' : 'missing'}</li>
          <li>User Data: {localStorageData.userData ? localStorageData.userData : 'missing'}</li>
        </ul>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <button onClick={testToken} style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
          Test Token
        </button>
        {tokenTest && (
          <pre style={{ marginTop: '10px', background: '#fff', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
            {tokenTest}
          </pre>
        )}
      </div>

      <div>
        <strong>Current Time:</strong> {new Date().toLocaleString()}
      </div>
    </div>
  )
}

export default AuthDebug
