import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import Button from '../../components/Button'
import Card from '../../components/Card'
import SEO from '../../components/SEO'
import profileAPI from '../../services/profileAPI'
import farmerAPI from '../../services/farmerAPI'
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
        
        const farmerInfo = profileData.farmers || {}
        const locationData = farmerInfo.location || {}
        
        // Handle location data structures (for future use when proper columns are added)
        let addressData = {}
        if (locationData.type === 'Point' && locationData.address) {
          // New structure: {type: "Point", coordinates: [...], address: {...}, ...}
          addressData = locationData.address || {}
        } else if (locationData.type === 'Address' && locationData.address) {
          // Address-only structure: {type: "Address", address: {...}}
          addressData = locationData.address || {}
        } else if (locationData.area || locationData.city) {
          // Legacy structure: {area: "...", city: "...", ...}
          addressData = locationData
        }
        
        // Load address data from proper database columns now that they are added
        // Prioritize database columns over location structures
        addressData.area = farmerInfo.area || addressData.area || '';
        addressData.landmark = farmerInfo.landmark || addressData.landmark || '';
        addressData.pincode = farmerInfo.pincode || addressData.pincode || '';
        addressData.city = farmerInfo.city || addressData.city || '';
        addressData.state = farmerInfo.state || addressData.state || '';
        
        // Set form data from profile
        setFormData({
          name: profileData.name || '',
          phone: profileData.phone || '',
          farmname: farmerInfo.farmname || '',
          description: farmerInfo.description || '',
          farmingtype: farmerInfo.farmingtype || 'organic',
          deliveryradius: farmerInfo.deliveryradius || 8,
          address: {
            area: addressData.area || '',
            landmark: addressData.landmark || '',
            pincode: addressData.pincode || '',
            city: addressData.city || '',
            state: addressData.state || '',
            latitude: farmerInfo.latitude || locationData.latitude || null,
            longitude: farmerInfo.longitude || locationData.longitude || null
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
      const response = await farmerAPI.getFarmerProducts()
      if (response.data.success) {
        setProducts(response.data.products || [])
      }
    } catch (err) {
      console.error('Error loading products:', err)
      setProducts([])
    }
  }

  // Test function to verify buttons work
  const testButtons = () => {
    console.log('Test button clicked!')
    console.log('Current form data:', formData)
    alert('Buttons are working! Check console for form data.')
  }

  // Auto-detect current location using browser geolocation
  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setError('Detecting your location...')
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        console.log('Current location detected:', { latitude, longitude })
        
        // Update form with current coordinates
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
          }
        }))
        
        // Reverse geocode to get address details
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'FarmToHome/1.0 (farmer-profile-location-detect)'
              }
            }
          )
          
          if (response.ok) {
            const data = await response.json()
            console.log('Reverse geocoded data:', data)
            
            if (data && data.address) {
              const address = data.address
              const city = address.city || address.town || address.village || ''
              const state = address.state || ''
              const postcode = address.postcode || ''
              const area = address.suburb || address.neighbourhood || address.road || ''
              
              setFormData(prev => ({
                ...prev,
                address: {
                  ...prev.address,
                  area: area || prev.address.area,
                  city: city || prev.address.city,
                  state: state || prev.address.state,
                  pincode: postcode || prev.address.pincode,
                  landmark: prev.address.landmark
                }
              }))
              
              console.log('Location auto-detected and address updated:', {
                latitude, longitude, city, state, postcode, area
              })
            }
          }
        } catch (err) {
          console.error('Reverse geocoding failed:', err)
        }
        
        setError(null)
        alert('📍 Location detected successfully! Coordinates: ' + 
              `${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n` +
              'You can now manually enter area and landmark details.')
      },
      (error) => {
        console.error('Geolocation error:', error)
        let errorMessage = 'Failed to detect location: '
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location permission denied. Please allow location access.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information unavailable.'
            break
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.'
            break
          default:
            errorMessage += 'Unknown error occurred.'
            break
        }
        
        setError(errorMessage)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  // Demo function to pre-fill test data
  const fillTestData = () => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        area: 'Hitech City, Hyderabad',
        pincode: '500081',
        city: '',
        state: '',
        landmark: '',
        latitude: null,
        longitude: null
      }
    }))
    console.log('Test data filled!')
    alert('Test data filled! Now you can test the auto-fetch buttons.')
  }

  // Auto-fetch complete location details
  const fetchCompleteLocation = async () => {
    if (!formData.address.area) {
      setError('Please enter area to fetch complete location')
      return
    }

    try {
      console.log('Fetching complete location for:', formData.address.area)
      
      // Use OpenStreetMap Nominatim API with user agent to avoid blocking
      const address = formData.address.area
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'FarmToHome/1.0 (farmer-profile-location-fetch)'
          }
        }
      )
      
      console.log('API response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('API response data:', data)
      
      if (data && data.length > 0) {
        const location = data[0]
        const { lat, lon, display_name, address: addressDetails } = location
        
        console.log('Location details:', { lat, lon, display_name, addressDetails })
        
        // Parse address components
        const city = addressDetails?.city || addressDetails?.town || addressDetails?.village || ''
        const state = addressDetails?.state || ''
        const postcode = addressDetails?.postcode || ''
        const landmark = addressDetails?.road || addressDetails?.neighbourhood || ''
        
        const updatedAddress = {
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          city: city || formData.address.city,
          state: state || formData.address.state,
          pincode: postcode || formData.address.pincode,
          landmark: landmark || formData.address.landmark
        }
        
        console.log('Updating address with:', updatedAddress)
        
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            ...updatedAddress
          }
        }))
        
        console.log('Complete location fetched successfully:', { 
          latitude: lat, 
          longitude: lon, 
          city, 
          state, 
          postcode, 
          landmark,
          fullAddress: display_name 
        })
        
        setError(null) // Clear any previous errors
      } else {
        console.log('No location data found')
        setError('Could not find location details for the given area')
      }
    } catch (err) {
      console.error('Error fetching complete location:', err)
      console.error('Error details:', err.message)
      
      if (err.message.includes('CORS')) {
        setError('CORS error: Please try again or use manual coordinate entry')
      } else if (err.message.includes('Failed to fetch')) {
        setError('Network error: Please check your internet connection')
      } else {
        setError(`Failed to fetch location: ${err.message}`)
      }
    }
  }

  // Auto-fetch coordinates from address
  const fetchCoordinates = async () => {
    if (!formData.address.area || !formData.address.pincode) {
      setError('Please enter area and pincode to fetch coordinates')
      return
    }

    try {
      console.log('Fetching coordinates for:', formData.address.area, formData.address.pincode)
      
      // Use OpenStreetMap Nominatim API with user agent
      const address = `${formData.address.area}, ${formData.address.pincode}`
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'FarmToHome/1.0 (farmer-profile-coordinate-fetch)'
          }
        }
      )
      
      console.log('Coordinates API response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Coordinates API response data:', data)
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0]
        
        console.log('Coordinates found:', { lat, lon, display_name })
        
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            latitude: parseFloat(lat),
            longitude: parseFloat(lon)
          }
        }))
        
        console.log('Coordinates updated successfully:', { latitude: lat, longitude: lon })
        
        // Also fetch city and state if not already set
        if (!formData.address.city || !formData.address.state) {
          const parts = display_name.split(', ')
          console.log('Parsing city/state from:', parts)
          
          if (parts.length >= 2) {
            setFormData(prev => ({
              ...prev,
              address: {
                ...prev.address,
                city: parts[parts.length - 3] || prev.address.city,
                state: parts[parts.length - 2] || prev.address.state
              }
            }))
            console.log('City/State updated from display name')
          }
        }
        
        setError(null) // Clear any previous errors
      } else {
        console.log('No coordinates found')
        setError('Could not find coordinates for the given address')
      }
    } catch (err) {
      console.error('Error fetching coordinates:', err)
      console.error('Error details:', err.message)
      
      if (err.message.includes('CORS')) {
        setError('CORS error: Please try again or use manual coordinate entry')
      } else if (err.message.includes('Failed to fetch')) {
        setError('Network error: Please check your internet connection')
      } else {
        setError(`Failed to fetch coordinates: ${err.message}`)
      }
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
  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      setError(null)

      // Validate required fields
      if (!formData.farmname) {
        setError('Farm name is required')
        return
      }

      // Prepare data for backend - include address data which will be stored in description
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
        // Address will be stored in description field temporarily
      }

      console.log('Sending profile data:', profileData)

      const response = await profileAPI.updateFarmerProfile(profileData)
      
      if (response.data.success) {
        setEditing(false)
        await loadProfile() // Reload profile data
        alert('Profile updated successfully! All address data has been saved.')
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
              <Button onClick={handleSaveProfile} variant="primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
          <Button onClick={() => navigate('/farmer/products')} variant="outline">
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
                    <span>{profile?.farmers?.farmname || 'Not set'}</span>
                  </div>
                  <div className="info-item">
                    <label>Description:</label>
                    <span>{profile?.farmers?.description || 'No description provided'}</span>
                  </div>
                  <div className="info-item">
                    <label>Farming Type:</label>
                    <span className="farming-type-badge">{profile?.farmers?.farmingtype || 'organic'}</span>
                  </div>
                  <div className="info-item">
                    <label>Delivery Radius:</label>
                    <span>{profile?.farmers?.deliveryradius || 8} km</span>
                  </div>
                  <div className="info-item">
                    <label>Verification Status:</label>
                    <span className={`status-badge ${profile?.farmers?.verificationstatus === 'approved' ? 'approved' : 'pending'}`}>
                      {profile?.farmers?.verificationstatus || 'Pending'}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Approval Status:</label>
                    <span className={`status-badge ${profile?.farmers?.isapproved ? 'approved' : 'pending'}`}>
                      {profile?.farmers?.isapproved ? 'Approved' : 'Pending Approval'}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Average Rating:</label>
                    <span>⭐ {profile?.farmers?.ratingaverage || 0}/5</span>
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
                        title="Auto-fetched from location detection"
                      />
                    </div>
                    <div className="form-group">
                      <label>Coordinates (Auto-detected)</label>
                      <div className="coordinates-display">
                        <span>Lat: {formData.address.latitude ? formData.address.latitude.toFixed(6) : 'Not detected'}</span>
                        <span>Lng: {formData.address.longitude ? formData.address.longitude.toFixed(6) : 'Not detected'}</span>
                      </div>
                      <small className="coordinates-hint">Click "Auto-Detect My Location" to get coordinates</small>
                    </div>
                  </div>

                  <div className="location-actions">
                    <Button 
                      onClick={detectCurrentLocation} 
                      variant="primary" 
                      size="small"
                    >
                      📍 Auto-Detect My Location
                    </Button>
                    <Button 
                      onClick={testButtons} 
                      variant="outline" 
                      size="small"
                    >
                      🧪 Test Buttons
                    </Button>
                    <Button 
                      onClick={fillTestData} 
                      variant="outline" 
                      size="small"
                    >
                      🎯 Fill Test Data
                    </Button>
                  </div>
                  
                  {/* Manual input section */}
                  <div className="manual-input-section">
                    <small className="manual-input-label">
                      📝 After auto-detecting location, coordinates and address details are saved.
                      Enter your specific area and landmark information.
                    </small>
                  </div>
                </div>
              ) : (
                <div className="location-info">
                  <div className="info-item">
                    <label>Area:</label>
                    <span>
                      {(() => {
                        // Prioritize database columns over location structures
                        const dbArea = profile?.farmers?.area;
                        if (dbArea) return dbArea;
                        
                        const loc = profile?.farmers?.location || {}
                        // Try location structure as fallback
                        if (loc.type === 'Point' && loc.address) return loc.address.area || 'Not provided'
                        if (loc.type === 'Address' && loc.address) return loc.address.area || 'Not provided'
                        if (loc.area) return loc.area || 'Not provided'
                        
                        return 'Not provided'
                      })()}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Landmark:</label>
                    <span>
                      {(() => {
                        // Prioritize database columns over location structures
                        const dbLandmark = profile?.farmers?.landmark;
                        if (dbLandmark) return dbLandmark;
                        
                        const loc = profile?.farmers?.location || {}
                        // Try location structure as fallback
                        if (loc.type === 'Point' && loc.address) return loc.address.landmark || 'Not provided'
                        if (loc.type === 'Address' && loc.address) return loc.address.landmark || 'Not provided'
                        if (loc.landmark) return loc.landmark || 'Not provided'
                        
                        return 'Not provided'
                      })()}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Pincode:</label>
                    <span>
                      {(() => {
                        // Prioritize database columns over location structures
                        const dbPincode = profile?.farmers?.pincode;
                        if (dbPincode) return dbPincode;
                        
                        const loc = profile?.farmers?.location || {}
                        // Try location structure as fallback
                        if (loc.type === 'Point' && loc.address) return loc.address.pincode || 'Not provided'
                        if (loc.type === 'Address' && loc.address) return loc.address.pincode || 'Not provided'
                        if (loc.pincode) return loc.pincode || 'Not provided'
                        
                        return 'Not provided'
                      })()}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>City:</label>
                    <span>
                      {(() => {
                        // Prioritize database columns over location structures
                        const dbCity = profile?.farmers?.city;
                        if (dbCity) return dbCity;
                        
                        const loc = profile?.farmers?.location || {}
                        // Try location structure as fallback
                        if (loc.type === 'Point' && loc.address) return loc.address.city || 'Not provided'
                        if (loc.type === 'Address' && loc.address) return loc.address.city || 'Not provided'
                        if (loc.city) return loc.city || 'Not provided'
                        
                        return 'Not provided'
                      })()}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>State:</label>
                    <span>
                      {(() => {
                        // Prioritize database columns over location structures
                        const dbState = profile?.farmers?.state;
                        if (dbState) return dbState;
                        
                        const loc = profile?.farmers?.location || {}
                        // Try location structure as fallback
                        if (loc.type === 'Point' && loc.address) return loc.address.state || 'Not provided'
                        if (loc.type === 'Address' && loc.address) return loc.address.state || 'Not provided'
                        if (loc.state) return loc.state || 'Not provided'
                        
                        return 'Not provided'
                      })()}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Coordinates:</label>
                    <span>
                      {profile?.farmers?.latitude && profile?.farmers?.longitude 
                        ? `${profile.farmers.latitude.toFixed(6)}, ${profile.farmers.longitude.toFixed(6)}`
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
              {editing ? (
                <div className="account-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                        pattern="[0-9]{10}"
                      />
                    </div>
                  </div>
                </div>
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
                  <div className="info-item">
                    <label>Role:</label>
                    <span className="role-badge">Farmer</span>
                  </div>
                  <div className="info-item">
                    <label>Farmer ID:</label>
                    <span className="id-badge">{profile?.farmers?._id || 'Not available'}</span>
                  </div>
                  <div className="info-item">
                    <label>Member Since:</label>
                    <span>{profile?.createdat ? new Date(profile.createdat).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'Not available'}</span>
                  </div>
                  <div className="info-item">
                    <label>Farm Created:</label>
                    <span>{profile?.farmers?.createdat ? new Date(profile.farmers.createdat).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'Not available'}</span>
                  </div>
                </div>
              )}
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
