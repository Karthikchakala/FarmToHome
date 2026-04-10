import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { profileAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../hooks/useToast'
import SEO from '../../components/SEO'
import Card from '../../components/Card'
import LoadingSpinner from '../../components/LoadingSpinner'
import Button from '../../components/Button'
import Input from '../../components/Input'
import './CustomerProfile.css'

const CustomerProfile = () => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [addressForm, setAddressForm] = useState({})
  const [saving, setSaving] = useState(false)
  const { success, error: showError } = useToast()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Load profile data
  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await profileAPI.getCustomerProfile()
      if (response.data.success) {
        setProfile(response.data.data)
        // Initialize edit forms with current data
        setEditForm({
          name: response.data.data.name,
          email: response.data.data.email,
          phone: response.data.data.phone
        })
        if (response.data.data.consumers?.defaultaddress) {
          setAddressForm({
            street: response.data.data.consumers.defaultaddress.street || '',
            city: response.data.data.consumers.defaultaddress.city || '',
            state: response.data.data.consumers.defaultaddress.state || '',
            pincode: response.data.data.consumers.defaultaddress.pincode || '',
            latitude: response.data.data.consumers.defaultaddress.latitude || '',
            longitude: response.data.data.consumers.defaultaddress.longitude || ''
          })
        }
      } else {
        setError(response.data.error || 'Failed to load profile')
      }
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Failed to connect to server. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  // Save personal information
  const savePersonalInfo = async () => {
    try {
      setSaving(true)
      
      const response = await profileAPI.updateCustomerProfile(editForm)
      if (response.data.success) {
        setProfile(prev => ({
          ...prev,
          ...editForm
        }))
        setIsEditing(false)
        success('Personal information updated successfully')
      } else {
        showError(response.data.error || 'Failed to update profile')
      }
    } catch (err) {
      console.error('Error updating profile:', err)
      showError('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Save address information
  const saveAddress = async () => {
    try {
      setSaving(true)
      
      // Structure data to match backend expectations
      const locationData = {
        latitude: addressForm.latitude || null,
        longitude: addressForm.longitude || null,
        address: {
          street: addressForm.street || null,
          city: addressForm.city || null,
          state: addressForm.state || null,
          pincode: addressForm.pincode || null
        }
      }
      
      const response = await profileAPI.updateCustomerLocation(locationData)
      if (response.data.success) {
        setProfile(prev => ({
          ...prev,
          consumers: {
            ...prev.consumers,
            defaultaddress: addressForm
          }
        }))
        setIsEditingAddress(false)
        success('Address updated successfully')
      } else {
        showError(response.data.error || 'Failed to update address')
      }
    } catch (err) {
      console.error('Error updating address:', err)
      showError('Failed to update address. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setAddressForm(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }))
          success('Location retrieved successfully')
        },
        (error) => {
          console.error('Error getting location:', error)
          showError('Failed to get location. Please enter manually.')
        }
      )
    } else {
      showError('Geolocation is not supported by your browser')
    }
  }

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/login')
        return
      }
      loadProfile()
    }
  }, [isAuthenticated, navigate, authLoading])

  if (authLoading || loading) {
    return (
      <>
        <SEO 
          title="My Profile"
          description="Manage your personal information and address"
        />
        <div className="customer-profile-loading">
          <LoadingSpinner size="large" text="Loading profile..." />
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <SEO 
          title="My Profile"
          description="Manage your personal information and address"
        />
        <div className="customer-profile-error">
          <div className="error-container">
            <h2>❌ Error Loading Profile</h2>
            <p>{error}</p>
            <Button onClick={loadProfile} variant="primary">
              Try Again
            </Button>
          </div>
        </div>
      </>
    )
  }

  if (!profile) {
    return (
      <>
        <SEO 
          title="My Profile"
          description="Manage your personal information and address"
        />
        <div className="customer-profile-empty">
          <div className="empty-container">
            <h2>📋 No Profile Data</h2>
            <p>Your profile information could not be loaded.</p>
            <Button onClick={loadProfile} variant="primary">
              Refresh
            </Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SEO 
        title="My Profile"
        description="Manage your personal information and address"
      />
      
      <div className="customer-profile">
        <div className="profile-header">
          <h1>👤 My Profile</h1>
          <p>Manage your personal information and delivery address</p>
        </div>

        <div className="profile-content">
          {/* Personal Information Section */}
          <Card className="profile-section">
            <div className="section-header">
              <h2>📝 Personal Information</h2>
              {!isEditing && (
                <Button 
                  variant="outline" 
                  size="small"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
            </div>

            {!isEditing ? (
              <div className="info-display">
                <div className="info-row">
                  <label>Full Name:</label>
                  <span>{profile.name || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <label>Email:</label>
                  <span>{profile.email || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <label>Phone:</label>
                  <span>{profile.phone || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <label>Account Type:</label>
                  <span className="role-badge">{profile.role || 'customer'}</span>
                </div>
                <div className="info-row">
                  <label>Member Since:</label>
                  <span>{new Date(profile.createdat).toLocaleDateString()}</span>
                </div>
              </div>
            ) : (
              <div className="info-edit">
                <div className="form-group">
                  <label>Full Name</label>
                  <Input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <Input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <Input
                    type="tel"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="form-actions">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={savePersonalInfo}
                    loading={saving}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Address Information Section */}
          <Card className="profile-section">
            <div className="section-header">
              <h2>🏠 Delivery Address</h2>
              {!isEditingAddress && (
                <Button 
                  variant="outline" 
                  size="small"
                  onClick={() => setIsEditingAddress(true)}
                >
                  Edit
                </Button>
              )}
            </div>

            {!isEditingAddress ? (
              <div className="info-display">
                {profile.consumers?.defaultaddress ? (
                  <>
                    <div className="info-row">
                      <label>Street Address:</label>
                      <span>{profile.consumers.defaultaddress.street || 'Not provided'}</span>
                    </div>
                    <div className="info-row">
                      <label>City:</label>
                      <span>{profile.consumers.defaultaddress.city || 'Not provided'}</span>
                    </div>
                    <div className="info-row">
                      <label>State:</label>
                      <span>{profile.consumers.defaultaddress.state || 'Not provided'}</span>
                    </div>
                    <div className="info-row">
                      <label>Pincode:</label>
                      <span>{profile.consumers.defaultaddress.pincode || 'Not provided'}</span>
                    </div>
                    <div className="info-row">
                      <label>Location:</label>
                      <span>
                        {profile.consumers.defaultaddress.latitude && profile.consumers.defaultaddress.longitude
                          ? `${profile.consumers.defaultaddress.latitude.toFixed(6)}, ${profile.consumers.defaultaddress.longitude.toFixed(6)}`
                          : 'Not provided'
                        }
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="no-address">
                    <p>📍 No delivery address set</p>
                    <Button 
                      variant="primary" 
                      size="small"
                      onClick={() => setIsEditingAddress(true)}
                    >
                      Add Address
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="info-edit">
                <div className="form-group">
                  <label>Street Address</label>
                  <Input
                    type="text"
                    value={addressForm.street || ''}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
                    placeholder="Enter your street address"
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <Input
                    type="text"
                    value={addressForm.city || ''}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Enter your city"
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <Input
                    type="text"
                    value={addressForm.state || ''}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="Enter your state"
                  />
                </div>
                <div className="form-group">
                  <label>Pincode</label>
                  <Input
                    type="text"
                    value={addressForm.pincode || ''}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, pincode: e.target.value }))}
                    placeholder="Enter your pincode"
                  />
                </div>
                <div className="location-section">
                  <label>Location (Optional)</label>
                  <div className="location-inputs">
                    <Input
                      type="number"
                      step="any"
                      value={addressForm.latitude || ''}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, latitude: e.target.value }))}
                      placeholder="Latitude"
                    />
                    <Input
                      type="number"
                      step="any"
                      value={addressForm.longitude || ''}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, longitude: e.target.value }))}
                      placeholder="Longitude"
                    />
                    <Button 
                      variant="outline" 
                      size="small"
                      onClick={getCurrentLocation}
                    >
                      📍 Get Location
                    </Button>
                  </div>
                </div>
                <div className="form-actions">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditingAddress(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={saveAddress}
                    loading={saving}
                  >
                    Save Address
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Wallet Balance Section */}
          <Card className="profile-section">
            <div className="section-header">
              <h2>💰 Wallet Balance</h2>
            </div>
            <div className="wallet-display">
              <div className="balance-amount">
                ₹{profile.consumers?.walletbalance || 0}
              </div>
              <p className="balance-note">Available for purchases</p>
            </div>
          </Card>

        </div>
      </div>
    </>
  )
}

export default CustomerProfile
