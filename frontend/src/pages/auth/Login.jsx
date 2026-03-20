import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../hooks/useToast'
import SEO from '../../components/SEO'
import Input from '../../components/Input'
import Button from '../../components/Button'
import LoadingSpinner from '../../components/LoadingSpinner'
import './Login.css'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()
  const { success, error } = useToast()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const result = await login(formData)
      if (result.success) {
        success('Login successful!')
        // Redirect based on user role from backend response
        const user = JSON.parse(localStorage.getItem('user'))
        if (user.role === 'admin') {
          navigate('/admin/dashboard')
        } else if (user.role === 'farmer') {
          navigate('/farmer/dashboard')
        } else {
          navigate('/customer/dashboard')
        }
      } else {
        error(result.message || 'Login failed')
      }
    } catch (err) {
      error('An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEO 
        title="Login - Farm to Table"
        description="Login to your Farm to Table account"
        keywords="login, farm to table, account"
      />
      
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>Welcome Back</h1>
            <p>Login to your Farm to Table account</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
            <p>
              <Link to="/forgot-password">Forgot password?</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default Login
