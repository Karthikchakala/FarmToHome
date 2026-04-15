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
    phone: '',
    // Dealer fields
    businessName: '',
    businessType: 'wholesale',
    licenseNumber: '',
    businessAddress: '',
    businessCity: '',
    businessState: '',
    businessPostalCode: '',
    businessPhone: '',
    businessEmail: '',
    // Expert fields
    specialization: '',
    expertiseLevel: 'beginner',
    experienceYears: 0,
    consultationFee: 0
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
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      error('Please fill in all required fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      error('Passwords do not match')
      return
    }

    // Role-specific validation
    if (formData.role === 'dealer') {
      if (!formData.businessName || !formData.licenseNumber || !formData.businessAddress || 
          !formData.businessCity || !formData.businessState || !formData.businessPostalCode || 
          !formData.businessPhone || !formData.businessEmail) {
        error('Please fill in all business information fields')
        return
      }
    }

    if (formData.role === 'expert') {
      if (!formData.specialization || !formData.expertiseLevel) {
        error('Please provide specialization and expertise level')
        return
      }
    }

    setLoading(true)
    try {
      // Prepare role-specific data
      const roleSpecificData = {}
      
      if (formData.role === 'dealer') {
        Object.assign(roleSpecificData, {
          businessName: formData.businessName,
          businessType: formData.businessType,
          licenseNumber: formData.licenseNumber,
          businessAddress: formData.businessAddress,
          businessCity: formData.businessCity,
          businessState: formData.businessState,
          businessPostalCode: formData.businessPostalCode,
          businessPhone: formData.businessPhone,
          businessEmail: formData.businessEmail
        })
      } else if (formData.role === 'expert') {
        Object.assign(roleSpecificData, {
          specialization: formData.specialization,
          expertiseLevel: formData.expertiseLevel,
          experienceYears: formData.experienceYears,
          consultationFee: formData.consultationFee
        })
      }

      const result = await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
        ...roleSpecificData
      })
      
      if (result.success) {
        success('Signup successful!')
        // Redirect based on user role
        const user = JSON.parse(localStorage.getItem('user'))
        if (user.role === 'admin') {
          navigate('/admin/dashboard')
        } else if (user.role === 'farmer') {
          navigate('/farmer/profile')
        } else if (user.role === 'dealer') {
          navigate('/dealer/dashboard')
        } else if (user.role === 'expert') {
          navigate('/expert/dashboard')
        } else {
          navigate('/products') // consumer default
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

          {/* Role Selection Dropdown */}
          <div className="role-selection">
            <h3>Sign up as:</h3>
            <div className="form-group">
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="role-dropdown"
                required
              >
                <option value="">Select your role</option>
                <option value="consumer">🛒 Customer - Buy fresh produce</option>
                <option value="farmer">🌾 Farmer - Sell your produce</option>
                <option value="dealer">📦 Dealer - Buy in bulk from farmers</option>
                <option value="expert">👨‍🌾 Expert - Consult with farmers</option>
                <option value="admin">👑 Admin - Platform management</option>
              </select>
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

            {/* Dealer-specific fields */}
            {formData.role === 'dealer' && (
              <div className="role-specific-fields">
                <h4>Business Information</h4>
                <div className="form-group">
                  <label htmlFor="businessName">Business Name *</label>
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="Enter your business name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="businessType">Business Type</label>
                  <select
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                  >
                    <option value="wholesale">Wholesale</option>
                    <option value="retail">Retail</option>
                    <option value="distributor">Distributor</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="licenseNumber">License Number *</label>
                  <input
                    type="text"
                    id="licenseNumber"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder="Enter your license number"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="businessAddress">Business Address *</label>
                  <input
                    type="text"
                    id="businessAddress"
                    name="businessAddress"
                    value={formData.businessAddress}
                    onChange={handleChange}
                    placeholder="Enter your business address"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="businessCity">City *</label>
                  <input
                    type="text"
                    id="businessCity"
                    name="businessCity"
                    value={formData.businessCity}
                    onChange={handleChange}
                    placeholder="Enter your city"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="businessState">State *</label>
                  <input
                    type="text"
                    id="businessState"
                    name="businessState"
                    value={formData.businessState}
                    onChange={handleChange}
                    placeholder="Enter your state"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="businessPostalCode">Postal Code *</label>
                  <input
                    type="text"
                    id="businessPostalCode"
                    name="businessPostalCode"
                    value={formData.businessPostalCode}
                    onChange={handleChange}
                    placeholder="Enter your postal code"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="businessPhone">Business Phone *</label>
                  <input
                    type="tel"
                    id="businessPhone"
                    name="businessPhone"
                    value={formData.businessPhone}
                    onChange={handleChange}
                    placeholder="Enter your business phone"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="businessEmail">Business Email *</label>
                  <input
                    type="email"
                    id="businessEmail"
                    name="businessEmail"
                    value={formData.businessEmail}
                    onChange={handleChange}
                    placeholder="Enter your business email"
                    required
                  />
                </div>
              </div>
            )}

            {/* Expert-specific fields */}
            {formData.role === 'expert' && (
              <div className="role-specific-fields">
                <h4>Expert Information</h4>
                <div className="form-group">
                  <label htmlFor="specialization">Specialization *</label>
                  <select
                    id="specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select your specialization</option>
                    <option value="organic_farming">Organic Farming</option>
                    <option value="pest_management">Pest Management</option>
                    <option value="soil_health">Soil Health</option>
                    <option value="crop_diseases">Crop Diseases</option>
                    <option value="irrigation">Irrigation Systems</option>
                    <option value="fertilizer_management">Fertilizer Management</option>
                    <option value="sustainable_agriculture">Sustainable Agriculture</option>
                    <option value="agricultural_economics">Agricultural Economics</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="expertiseLevel">Expertise Level *</label>
                  <select
                    id="expertiseLevel"
                    name="expertiseLevel"
                    value={formData.expertiseLevel}
                    onChange={handleChange}
                    required
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                    <option value="master">Master</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="experienceYears">Years of Experience</label>
                  <input
                    type="number"
                    id="experienceYears"
                    name="experienceYears"
                    value={formData.experienceYears}
                    onChange={handleChange}
                    placeholder="Enter years of experience"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="consultationFee">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    id="consultationFee"
                    name="consultationFee"
                    value={formData.consultationFee}
                    onChange={handleChange}
                    placeholder="Enter consultation fee"
                    min="0"
                    step="100"
                  />
                </div>
              </div>
            )}

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
