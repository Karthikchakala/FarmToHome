import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { profileAPI, orderAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import SEO from '../../components/SEO'
import Card from '../../components/Card'
import LoadingSpinner from '../../components/LoadingSpinner'
import Button from '../../components/Button'
import Input from '../../components/Input'
import './CustomerProfile.css'

const CustomerProfile = () => {
  const [profile, setProfile] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [addressForm, setAddressForm] = useState({
    houseNo: '',
    street: '',
    landmark: '',
    pincode: '',
    city: '',
    state: ''
  })
  const [gettingLocation, setGettingLocation] = useState(false)
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Wait for AuthContext to load, then check authentication
  useEffect(() => {
    if (!authLoading) {
      console.log('CustomerProfile - Auth check:', { isAuthenticated, user, authLoading })
      setCheckingAuth(false)
      if (!isAuthenticated) {
        console.log('CustomerProfile - Redirecting to login')
        navigate('/login')
        return
      }
    }
  }, [isAuthenticated, navigate, user, authLoading])

  useEffect(() => {
    if (isAuthenticated && !checkingAuth && !authLoading) {
      console.log('CustomerProfile - Loading profile and orders')
      loadProfile()
      loadOrders()
    }
  }, [isAuthenticated, checkingAuth, authLoading])

  // Show loading while AuthContext is loading or checking auth
  if (authLoading || checkingAuth) {
    return <LoadingSpinner size="large" text="Checking authentication..." />
  }

  const loadProfile = async () => {
    try {
      // Use actual user data from AuthContext
      if (user) {
        // Start with user data from AuthContext
        const userProfile = {
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || {
            houseNo: '',
            street: '',
            landmark: '',
            pincode: '',
            city: '',
            state: ''
          },
          location: user.location || null
        }
        
        setProfile(userProfile)
        setEditForm({
          name: userProfile.name,
          email: userProfile.email,
          phone: userProfile.phone
        })
        setAddressForm(userProfile.address)
        
        // Try to fetch additional profile data from API
        try {
          const response = await profileAPI.getCustomerProfile()
          if (response.data.success) {
            const apiProfile = response.data.data
            setProfile(apiProfile)
            setEditForm({
              name: apiProfile.name,
              email: apiProfile.email,
              phone: apiProfile.phone
            })
            setAddressForm(apiProfile.address || userProfile.address)
          }
        } catch (apiError) {
          console.log('API call failed, using AuthContext data:', apiError.message)
          // Continue with AuthContext data if API fails
        }
      }
    } catch (err) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    try {
      // Fetch real orders from backend
      const response = await orderAPI.getOrders()
      if (response.data.success) {
        setOrders(response.data.data.orders || [])
      } else {
        console.log('Failed to load orders:', response.data.error)
        setOrders([])
      }
    } catch (err) {
      console.error('Failed to load orders:', err)
      setOrders([])
    }
  }

  const handleEditProfile = async (e) => {
    e.preventDefault()
    try {
      // Update local state immediately for better UX
      const updatedProfile = {...profile, ...editForm}
      setProfile(updatedProfile)
      
      // Try to save to backend
      try {
        const response = await profileAPI.updateCustomerProfile(editForm)
        if (response.data.success) {
          // Update user in AuthContext as well
          const updatedUser = {...user, ...editForm}
          localStorage.setItem('user', JSON.stringify(updatedUser))
          // Note: You might want to update the AuthContext state here too
          console.log('Profile updated successfully')
        }
      } catch (apiError) {
        console.log('Failed to save to backend, updating local state only:', apiError.message)
        setError('Failed to save changes to server, but local data updated')
      }
      
      setIsEditing(false)
    } catch (err) {
      setError('Failed to update profile')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match')
      return
    }
    
    try {
      // Mock password change
      setIsChangingPassword(false)
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      // Uncomment when backend is ready
      // const response = await profileAPI.changePassword(passwordForm)
      // if (response.data.success) {
      //   setIsChangingPassword(false)
      //   setPasswordForm({...passwordForm, currentPassword: '', newPassword: '', confirmPassword: ''})
      // }
    } catch (err) {
      setError('Failed to change password')
    }
  }

  const handleUpdateAddress = async (e) => {
    e.preventDefault()
    try {
      // Update local state immediately for better UX
      const updatedProfile = {...profile, address: addressForm}
      setProfile(updatedProfile)
      
      // Try to save to backend
      try {
        const response = await profileAPI.updateCustomerLocation(addressForm)
        if (response.data.success) {
          // Update user in AuthContext as well
          const updatedUser = {...user, address: addressForm}
          localStorage.setItem('user', JSON.stringify(updatedUser))
          console.log('Address updated successfully')
        }
      } catch (apiError) {
        console.log('Failed to save address to backend, updating local state only:', apiError.message)
        setError('Failed to save address to server, but local data updated')
      }
    } catch (err) {
      setError('Failed to update address')
    }
  }

  const getCurrentLocation = () => {
    setGettingLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Mock reverse geocoding
            const mockLocationData = {
              pincode: '560001',
              city: 'Bangalore',
              state: 'Karnataka'
            }
            setAddressForm({...addressForm, ...mockLocationData})
            setGettingLocation(false)
            
            // Uncomment when backend is ready
            // const response = await profileAPI.reverseGeocode({
            //   lat: position.coords.latitude,
            //   lng: position.coords.longitude
            // })
            // if (response.data.success) {
            //   setAddressForm({...addressForm, ...response.data.data})
            // }
          } catch (err) {
            setError('Failed to get location details')
            setGettingLocation(false)
          }
        },
        (err) => {
          setError('Failed to get your location')
          setGettingLocation(false)
        }
      )
    } else {
      setError('Geolocation is not supported by your browser')
      setGettingLocation(false)
    }
  }

  if (loading) {
    return (
      <div className="customer-profile">
        <div className="profile-header">
          <h1>My Profile</h1>
        </div>
        <LoadingSpinner size="large" text="Loading profile..." />
      </div>
    )
  }

  return (
    <>
      <SEO 
        title="Customer Profile"
        description="Manage your account information, view order history, and track your orders on Farm to Table."
        keywords="customer profile, account settings, order history, farm to table"
      />
      
      <div className="customer-profile">
        <div className="profile-header">
          <h1>My Profile</h1>
          <Button onClick={() => navigate('/products')} variant="outline">
            Shop Now
          </Button>
        </div>

        <div className="profile-tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button>
          <button
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        <div className="profile-content">
          {activeTab === 'overview' && (
            <div className="tab-content">
              <div className="profile-section">
                <Card variant="outlined" padding="large">
                  <div className="section-header">
                    <h2>Account Information</h2>
                    <Button 
                      onClick={() => setIsEditing(!isEditing)}
                      variant="outline"
                      size="small"
                    >
                      {isEditing ? 'Cancel' : '✏️ Edit'}
                    </Button>
                  </div>
                  
                  {isEditing ? (
                    <form onSubmit={handleEditProfile} className="edit-form">
                      <div className="form-group">
                        <label>Name</label>
                        <Input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <Input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone</label>
                        <Input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          required
                        />
                      </div>
                      <div className="form-actions">
                        <Button type="submit" variant="primary">
                          Save Changes
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
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
                    </div>
                  )}
                </Card>
              </div>

              <div className="profile-section">
                <Card variant="outlined" padding="large">
                  <h2>Delivery Address</h2>
                  <form onSubmit={handleUpdateAddress} className="address-form">
                    <div className="address-fields">
                      <div className="form-group">
                        <label>House No.</label>
                        <Input
                          type="text"
                          value={addressForm.houseNo}
                          onChange={(e) => setAddressForm({...addressForm, houseNo: e.target.value})}
                          placeholder="Enter house number"
                        />
                      </div>
                      <div className="form-group">
                        <label>Street</label>
                        <Input
                          type="text"
                          value={addressForm.street}
                          onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                          placeholder="Enter street name"
                        />
                      </div>
                      <div className="form-group">
                        <label>Landmark</label>
                        <Input
                          type="text"
                          value={addressForm.landmark}
                          onChange={(e) => setAddressForm({...addressForm, landmark: e.target.value})}
                          placeholder="Enter nearby landmark"
                        />
                      </div>
                      <div className="location-fields">
                        <div className="form-group">
                          <label>Pincode</label>
                          <Input
                            type="text"
                            value={addressForm.pincode}
                            onChange={(e) => setAddressForm({...addressForm, pincode: e.target.value})}
                            placeholder="Enter pincode"
                          />
                        </div>
                        <div className="form-group">
                          <label>City</label>
                          <Input
                            type="text"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                            placeholder="Enter city"
                          />
                        </div>
                        <div className="form-group">
                          <label>State</label>
                          <Input
                            type="text"
                            value={addressForm.state}
                            onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                            placeholder="Enter state"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="form-actions">
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={getCurrentLocation}
                        disabled={gettingLocation}
                      >
                        {gettingLocation ? '📍 Getting Location...' : '📍 Use Current Location'}
                      </Button>
                      <Button type="submit" variant="primary">
                        Update Address
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="tab-content">
              <div className="profile-section">
                <Card variant="outlined" padding="large">
                  <h2>Recent Orders</h2>
                  {orders.length === 0 ? (
                    <div className="empty-orders">
                      <p>No orders yet. Start shopping to see your order history!</p>
                      <Button onClick={() => navigate('/products')} variant="primary">
                        Browse Products
                      </Button>
                    </div>
                  ) : (
                    <div className="orders-list">
                      {orders.map((order) => (
                        <div key={order._id} className="order-item">
                          <div className="order-header">
                            <h4>Order #{order.orderNumber}</h4>
                            <span className={`status ${order.status}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="order-details">
                            <p>Date: {order.createdAt}</p>
                            <p>Total: ₹{order.totalAmount}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="tab-content">
              <div className="profile-section">
                <Card variant="outlined" padding="large">
                  <h2>Password Settings</h2>
                  <Button 
                    onClick={() => setIsChangingPassword(!isChangingPassword)}
                    variant="outline"
                  >
                    🔒 Change Password
                  </Button>
                  
                  {isChangingPassword && (
                    <form onSubmit={handleChangePassword} className="password-form">
                      <div className="form-group">
                        <label>Current Password</label>
                        <Input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>New Password</label>
                        <Input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Confirm New Password</label>
                        <Input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                          required
                        />
                      </div>
                      <div className="form-actions">
                        <Button type="submit" variant="primary">
                          Update Password
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setIsChangingPassword(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </Card>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    </>
  )
}

export default CustomerProfile
