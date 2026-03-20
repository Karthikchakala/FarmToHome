import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import Button from '../../components/Button'
import Card from '../../components/Card'
import SEO from '../../components/SEO'
import profileAPI from '../../services/profileAPI'
import './FarmerProfile.css'

const FarmerProfile = () => {
  const [profile, setProfile] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    farmname: '',
    description: '',
    farmingtype: 'organic',
    deliveryradius: 8,
    address: {
      area: '',
      landmark: '',
      pincode: '',
      city: '',
      state: '',
      latitude: null,
      longitude: null
    }
  })

  // Load farmer profile from backend
  useEffect(() => {
    loadProfile()
    loadProducts()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await profileAPI.getProfile()
      
      if (response.data.success) {
        const profileData = response.data.data
        setProfile(profileData)
        
        // Set form data from profile
        setFormData({
          name: profileData.name || '',
          phone: profileData.phone || '',
          farmname: profileData.farmname || '',
          description: profileData.description || '',
          farmingtype: profileData.farmingtype || 'organic',
          deliveryradius: profileData.deliveryradius || 8,
          address: {
            area: profileData.address?.area || '',
            landmark: profileData.address?.landmark || '',
            pincode: profileData.address?.pincode || '',
            city: profileData.address?.city || '',
            state: profileData.address?.state || '',
            latitude: profileData.latitude || profileData.location?.latitude || null,
            longitude: profileData.longitude || profileData.location?.longitude || null
          }
        })
      }
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      // TODO: Load farmer's products
      setProducts([])
    } catch (err) {
      console.error('Error loading products:', err)
    }
  }

  // Auto-fetch coordinates from address
  const fetchCoordinates = async () => {
    if (!formData.address.area || !formData.address.pincode) {
      setError('Please enter area and pincode to fetch coordinates')
      return
    }

    try {
      // Use OpenStreetMap Nominatim API (free)
      const address = `${formData.address.area}, ${formData.address.pincode}, India`
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data && data.length > 0) {
          const location = data[0]
          setFormData(prev => ({
            ...prev,
            address: {
              ...prev.address,
              latitude: parseFloat(location.lat),
              longitude: parseFloat(location.lon)
            }
          }))
          console.log('Coordinates fetched:', { lat: location.lat, lon: location.lon })
        } else {
          setError('Could not find coordinates for this address')
        }
      } else {
        throw new Error('Failed to fetch coordinates')
      }
    } catch (err) {
      console.error('Error fetching coordinates:', err)
      setError('Failed to fetch coordinates. Please enter manually.')
    }
  }

  // Auto-fetch city and state from pincode
  const fetchCityState = async (pincode) => {
    if (pincode.length !== 6) {
      return
    }

    try {
      // Use Indian postal API (free)
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data && data[0]) {
          const postalData = data[0]
          setFormData(prev => ({
            ...prev,
            address: {
              ...prev.address,
              city: postalData.District || '',
              state: postalData.StateName || ''
            }
          }))
          console.log('City/State fetched:', { city: postalData.District, state: postalData.StateName })
        }
      }
    } catch (err) {
      console.error('Error fetching city/state:', err)
      // Don't show error for this as it's a convenience feature
    }
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle address input changes
  const handleAddressChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value
      }
    }))

    // Auto-fetch city/state when pincode changes
    if (name === 'pincode') {
      fetchCityState(value)
    }
  }

  // Save profile
  const saveProfile = async () => {
    try {
      setSaving(true)
      setError(null)

      // Validate required fields
      if (!formData.farmname) {
        setError('Farm name is required')
        return
      }

      if (!formData.address.area || !formData.address.pincode) {
        setError('Area and pincode are required')
        return
      }

      // Prepare data for backend
      const profileData = {
        name: formData.name,
        phone: formData.phone,
        farmname: formData.farmname,
        description: formData.description,
        farmingtype: formData.farmingtype,
        deliveryradius: formData.deliveryradius,
        location: {
          latitude: formData.address.latitude,
          longitude: formData.address.longitude
        },
        address: {
          area: formData.address.area,
          landmark: formData.address.landmark,
          pincode: formData.address.pincode,
          city: formData.address.city,
          state: formData.address.state
        }
      }

      const response = await profileAPI.updateFarmerProfile(profileData)
      
      if (response.data.success) {
        setEditing(false)
        await loadProfile() // Reload profile data
        alert('Profile updated successfully!')
      } else {
        setError('Failed to update profile')
      }
    } catch (err) {
      console.error('Error saving profile:', err)
      setError('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard farmer-dashboard">
        <div className="dashboard-header">
          <h1>Farmer Profile</h1>
        </div>
        <LoadingSpinner size="large" text="Loading profile..." />
      </div>
    )
  }

  return (
    <div className="dashboard farmer-dashboard">
      <SEO 
        title="Farmer Profile - Farm to Table"
        description="Manage your farm profile and products"
      />
      
      <div className="dashboard-header">
        <h1>My Profile</h1>
        <div className="header-actions">
          {!editing ? (
            <Button onClick={() => setEditing(true)} variant="primary">
              Edit Profile
            </Button>
          ) : (
            <>
              <Button onClick={() => setEditing(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={saveProfile} variant="primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
          <Button onClick={() => navigate('/farmer-products')} variant="outline">
            Manage Products
          </Button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="farmer-profile">
        <div className="profile-content">
          {/* Profile Form */}
          <div className="profile-section">
            <Card variant="outlined" padding="large">
              <h2>Farm Information</h2>
              
              {editing ? (
                <div className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Farm Name *</label>
                      <input
                        type="text"
                        name="farmname"
                        value={formData.farmname}
                        onChange={handleInputChange}
                        placeholder="Enter your farm name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Farming Type</label>
                      <select
                        name="farmingtype"
                        value={formData.farmingtype}
                        onChange={handleInputChange}
                      >
                        <option value="organic">Organic</option>
                        <option value="natural">Natural</option>
                        <option value="mixed">Mixed</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your farm and farming practices"
                      rows={4}
                    />
                  </div>

                  <div className="form-group">
                    <label>Delivery Radius (km)</label>
                    <input
                      type="number"
                      name="deliveryradius"
                      value={formData.deliveryradius}
                      onChange={handleInputChange}
                      min="1"
                      max="20"
                    />
                  </div>
                </div>
              ) : (
                <div className="farm-info">
                  <div className="info-item">
                    <label>Farm Name:</label>
                    <span>{profile?.farmname}</span>
                  </div>
                  <div className="info-item">
                    <label>Description:</label>
                    <span>{profile?.description || 'No description provided'}</span>
                  </div>
                  <div className="info-item">
                    <label>Farming Type:</label>
                    <span className="farming-type-badge">{profile?.farmingtype || 'organic'}</span>
                  </div>
                  <div className="info-item">
                    <label>Delivery Radius:</label>
                    <span>{profile?.deliveryradius || 8} km</span>
                  </div>
                  <div className="info-item">
                    <label>Status:</label>
                    <span className={`status-badge ${profile?.isapproved ? 'approved' : 'pending'}`}>
                      {profile?.isapproved ? 'Approved' : 'Pending Approval'}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Location Information */}
          <div className="profile-section">
            <Card variant="outlined" padding="large">
              <h2>Farm Location</h2>
              
              {editing ? (
                <div className="location-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Area *</label>
                      <input
                        type="text"
                        name="area"
                        value={formData.address.area}
                        onChange={handleAddressChange}
                        placeholder="e.g., Hitech City, Madhapur"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Landmark</label>
                      <input
                        type="text"
                        name="landmark"
                        value={formData.address.landmark}
                        onChange={handleAddressChange}
                        placeholder="e.g., Near Cyber Tower"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Pincode *</label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.address.pincode}
                        onChange={handleAddressChange}
                        placeholder="e.g., 500081"
                        maxLength={6}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.address.city}
                        onChange={handleAddressChange}
                        placeholder="e.g., Hyderabad"
                        readOnly
                        title="Auto-fetched from pincode"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.address.state}
                        onChange={handleAddressChange}
                        placeholder="e.g., Telangana"
                        readOnly
                        title="Auto-fetched from pincode"
                      />
                    </div>
                    <div className="form-group">
                      <label>Coordinates</label>
                      <div className="coordinates-display">
                        <span>Lat: {formData.address.latitude || 'Not set'}</span>
                        <span>Lng: {formData.address.longitude || 'Not set'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="location-actions">
                    <Button 
                      onClick={fetchCoordinates} 
                      variant="outline" 
                      size="small"
                      disabled={!formData.address.area || !formData.address.pincode}
                    >
                      📍 Auto-fetch Coordinates
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="location-info">
                  <div className="info-item">
                    <label>Area:</label>
                    <span>{profile?.address?.area || 'Not provided'}</span>
                  </div>
                  <div className="info-item">
                    <label>Landmark:</label>
                    <span>{profile?.address?.landmark || 'Not provided'}</span>
                  </div>
                  <div className="info-item">
                    <label>Pincode:</label>
                    <span>{profile?.address?.pincode || 'Not provided'}</span>
                  </div>
                  <div className="info-item">
                    <label>City:</label>
                    <span>{profile?.address?.city || 'Not provided'}</span>
                  </div>
                  <div className="info-item">
                    <label>State:</label>
                    <span>{profile?.address?.state || 'Not provided'}</span>
                  </div>
                  <div className="info-item">
                    <label>Coordinates:</label>
                    <span>
                      {profile?.latitude && profile?.longitude 
                        ? `${profile.latitude.toFixed(6)}, ${profile.longitude.toFixed(6)}`
                        : 'Not set'
                      }
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Account Information */}
          <div className="profile-section">
            <Card variant="outlined" padding="large">
              <h2>Account Information</h2>
              <div className="account-info">
                <div className="info-item">
                  <label>Name:</label>
                  <span>{profile?.name}</span>
                </div>
                <div className="info-item">
                  <label>Email:</label>
                  <span>{profile?.email}</span>
                </div>
                <div className="info-item">
                  <label>Phone:</label>
                  <span>{profile?.phone}</span>
                </div>
                <div className="info-item">
                  <label>Role:</label>
                  <span className="role-badge">Farmer</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Statistics */}
          <div className="profile-section">
            <Card variant="outlined" padding="large">
              <h2>Statistics</h2>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{products.length}</div>
                  <div className="stat-label">Total Products</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{products.filter(p => p.isavailable).length}</div>
                  <div className="stat-label">Available Products</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{products.filter(p => p.stockquantity > 0).length}</div>
                  <div className="stat-label">In Stock</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{profile?.totalreviews || 0}</div>
                  <div className="stat-label">Total Reviews</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FarmerProfile
