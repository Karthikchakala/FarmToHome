import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../hooks/useToast'
import SEO from '../../components/SEO'
import Input from '../../components/Input'
import Button from '../../components/Button'
import LoadingSpinner from '../../components/LoadingSpinner'
import './Signup.css'

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'consumer',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { signup } = useAuth()
  const { success, error } = useToast()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.password) {
      error('Please fill in all required fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const result = await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone
      })
      
      if (result.success) {
        success('Signup successful!')
        // Redirect to products page for quick ordering
        const user = JSON.parse(localStorage.getItem('user'))
        if (user.role === 'admin') {
          navigate('/admin/dashboard')
        } else if (user.role === 'farmer') {
          navigate('/farmer/profile')
        } else {
          navigate('/products')
        }
      } else {
        error(result.message || 'Signup failed')
      }
    } catch (err) {
      error('An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEO 
        title="Sign Up - Farm to Table"
        description="Create your Farm to Table account"
        keywords="signup, register, farm to table, account"
      />
      
      <div className="signup-container">
        <div className="signup-card">
          <div className="signup-header">
            <h1>Create Account</h1>
            <p>Join Farm to Table and connect with local farmers</p>
          </div>

          {/* Role Selection Buttons */}
          <div className="role-selection">
            <h3>Sign up as:</h3>
            <div className="role-buttons">
              <button
                type="button"
                className={`role-btn ${formData.role === 'consumer' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'consumer' })}
              >
                🛒 Customer
              </button>
              <button
                type="button"
                className={`role-btn ${formData.role === 'farmer' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'farmer' })}
              >
                🌾 Farmer
              </button>
              <button
                type="button"
                className={`role-btn ${formData.role === 'admin' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'admin' })}
              >
                👑 Admin
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>

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
              <label htmlFor="phone">Phone Number (Optional)</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
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
                placeholder="Create a password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="signup-footer">
            <p>
              Already have an account? <Link to="/login">Login</Link>
            </p>
            <p>
              By creating an account, you agree to our{' '}
              <Link to="/terms">Terms of Service</Link> and{' '}
              <Link to="/privacy">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default Signup
