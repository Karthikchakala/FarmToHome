import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { productAPI } from '../../services/api'
import { cartAPI } from '../../services/cartAPI'
import { subscriptionAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import './CustomerProducts.css'
import './CustomerProductsSubscription.css'

const CustomerProducts = () => {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [customerLocation, setCustomerLocation] = useState(null)
  const [locationPermission, setLocationPermission] = useState('prompting') // 'prompting', 'granted', 'denied'
  
  // Subscription modal state
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [subscriptionData, setSubscriptionData] = useState({
    frequency: 'WEEKLY',
    deliveryDay: 'MONDAY',
    quantity: 1,
    addressOption: 'new', // 'default' or 'new'
    deliveryAddress: {
      street: '',
      doorNo: '',
      city: '',
      state: '',
      pincode: '',
      latitude: null,
      longitude: null
    },
    requireApproval: false
  })
  const [creatingSubscription, setCreatingSubscription] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [defaultAddress, setDefaultAddress] = useState(null)

  useEffect(() => {
    requestLocationPermission()
    loadCustomerLocation()
  }, [])

  const requestLocationPermission = async () => {
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        setLocationPermission('denied')
        setError('Location services are not supported by your browser')
        return
      }

      // Request permission and get location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationPermission('granted')
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
          setCustomerLocation(location)
          loadProducts(location) // Pass the location to loadProducts
        },
        (error) => {
          setLocationPermission('denied')
          console.log('Location permission denied or error:', error)
          // Try to load from profile if location access is denied
          loadCustomerLocation()
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    } catch (error) {
      setLocationPermission('denied')
      console.log('Error requesting location:', error)
      loadCustomerLocation()
    }
  }

  const loadCustomerLocation = async () => {
    try {
      // Get customer location from profile or browser geolocation
      if (user?.address) {
        const location = {
          latitude: user.address.latitude,
          longitude: user.address.longitude,
          city: user.address.city,
          state: user.address.state
        }
        setCustomerLocation(location)
        loadProducts(location) // Load products with profile location
      } else {
        // Fallback to browser geolocation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              }
              setCustomerLocation(location)
              loadProducts(location) // Load products with browser location
            },
            (error) => {
              console.log('Geolocation not available')
              // Load all products as fallback
              loadProducts()
            }
          )
        } else {
          // Load all products as fallback
          loadProducts()
        }
      }
    } catch (error) {
      console.log('Error loading customer location:', error)
      // Load all products as fallback
      loadProducts()
    }
  }

  const loadProducts = async (location = null) => {
    try {
      setLoading(true)
      setError(null)
      
      const currentLocation = location || customerLocation
      console.log('Loading products with location:', currentLocation)
      
      let response
      
      if (currentLocation) {
        // Get nearby products based on customer location (5-7km radius)
        console.log('Fetching nearby products...')
        response = await productAPI.getNearbyProducts({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          radius: 7 // 7km radius
        })
      } else {
        // Fallback to all products if no location
        console.log('Fetching all products...')
        response = await productAPI.getProducts()
      }
      
      console.log('API Response:', response)
      console.log('Response data:', response.data)
      
      if (response.data.success) {
        console.log('Products loaded:', response.data.data?.length || 0)
        setProducts(response.data.data || [])
      } else {
        setError('Failed to load products')
      }
    } catch (err) {
      console.error('Error loading products:', err)
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  // Reload products when location changes
  useEffect(() => {
    if (customerLocation) {
      loadProducts()
    }
  }, [customerLocation])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name?.localeCompare(b.name) || 0
      case 'price-low':
        return (a.priceperunit || 0) - (b.priceperunit || 0)
      case 'price-high':
        return (b.priceperunit || 0) - (a.priceperunit || 0)
      case 'rating':
        return (b.ratingaverage || 0) - (a.ratingaverage || 0)
      default:
        return 0
    }
  })

  const calculateDistance = (product) => {
    if (!customerLocation || !product.farmer?.location) return 'Unknown'
    
    const R = 6371 // Earth's radius in km
    const dLat = (product.farmer.location.latitude - customerLocation.latitude) * Math.PI / 180
    const dLon = (product.farmer.location.longitude - customerLocation.longitude) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(customerLocation.latitude * Math.PI / 180) * Math.cos(product.farmer.location.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c
    
    return `${distance.toFixed(1)} km`
  }

  const [addedProducts, setAddedProducts] = useState({})
  const [addingToCart, setAddingToCart] = useState({})
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const handleAddToCart = async (product) => {
    try {
      setAddingToCart(prev => ({ ...prev, [product._id]: true }))
      
      const response = await cartAPI.addToCart(product._id, 1)
      
      if (response.data.success) {
        setAddedProducts(prev => ({ ...prev, [product._id]: true }))
        setToastMessage(`✅ ${product.name} added to cart!`)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
      } else {
        setToastMessage(`❌ Failed to add ${product.name} to cart`)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      setToastMessage(`❌ ${error.response?.data?.message || 'Failed to add to cart'}`)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } finally {
      setAddingToCart(prev => ({ ...prev, [product._id]: false }))
    }
  }

  // Subscription handlers
  const handleOpenSubscriptionModal = async (product) => {
    setSelectedProduct(product)
    
    // Load default address
    await loadDefaultAddress()
    
    setSubscriptionData({
      frequency: 'WEEKLY',
      deliveryDay: 'MONDAY',
      quantity: 1,
      addressOption: defaultAddress ? 'default' : 'new',
      deliveryAddress: {
        street: '',
        doorNo: '',
        city: '',
        state: '',
        pincode: '',
        latitude: null,
        longitude: null
      },
      requireApproval: true
    })
    setShowSubscriptionModal(true)
  }

  const loadDefaultAddress = async () => {
    try {
      // Get consumer profile with default address
      const response = await fetch(`/api/profile/customer/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Profile response:', data)
        
        if (data.success && data.data) {
          // Check if defaultaddress exists in consumers data
          const defaultAddr = data.data.consumers?.defaultaddress
          console.log('Default address found:', defaultAddr)
          
          if (defaultAddr && defaultAddr.street) {
            setDefaultAddress({
              street: defaultAddr.street || '',
              doorNo: defaultAddr.doorNo || '',
              city: defaultAddr.city || '',
              state: defaultAddr.state || '',
              pincode: defaultAddr.pincode || '',
              latitude: defaultAddr.latitude?.toString() || null,
              longitude: defaultAddr.longitude?.toString() || null
            })
          } else {
            console.log('No valid default address found')
            setDefaultAddress(null)
          }
        }
      } else {
        console.error('Profile API error:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to load default address:', error)
      setDefaultAddress(null)
    }
  }

  const detectCurrentLocation = async () => {
    setDetectingLocation(true)
    
    try {
      if (!navigator.geolocation) {
        alert('Location services are not supported by your browser')
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          
          // Use reverse geocoding to get address details
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
              {
                headers: {
                  'User-Agent': 'FarmToHome/1.0'
                }
              }
            )
            
            if (response.ok) {
              const data = await response.json()
              const address = data.address || {}
              
              setSubscriptionData(prev => ({
                ...prev,
                deliveryAddress: {
                  ...prev.deliveryAddress,
                  street: address.road || address.street || '',
                  city: address.city || address.town || address.village || '',
                  state: address.state || '',
                  pincode: address.postcode || '',
                  latitude: latitude.toString(),
                  longitude: longitude.toString()
                }
              }))
            }
          } catch (geocodeError) {
            console.error('Failed to get address from coordinates:', geocodeError)
            // Still set coordinates even if geocoding fails
            setSubscriptionData(prev => ({
              ...prev,
              deliveryAddress: {
                ...prev.deliveryAddress,
                latitude: latitude.toString(),
                longitude: longitude.toString()
              }
            }))
          }
          
          setDetectingLocation(false)
        },
        (error) => {
          console.error('Location detection failed:', error)
          alert('Failed to detect location. Please enter address manually.')
          setDetectingLocation(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    } catch (error) {
      console.error('Location detection error:', error)
      alert('Failed to detect location. Please enter address manually.')
      setDetectingLocation(false)
    }
  }

  const handleAddressOptionChange = (option) => {
    setSubscriptionData(prev => ({
      ...prev,
      addressOption: option,
      deliveryAddress: option === 'default' && defaultAddress ? defaultAddress : {
        street: '',
        doorNo: '',
        city: '',
        state: '',
        pincode: '',
        latitude: null,
        longitude: null
      }
    }))
  }

  const handleCloseSubscriptionModal = () => {
    setShowSubscriptionModal(false)
    setSelectedProduct(null)
  }

  const handleCreateSubscription = async () => {
    if (!selectedProduct) return

    // Validate delivery address
    if (!subscriptionData.deliveryAddress.street || 
        !subscriptionData.deliveryAddress.city || 
        !subscriptionData.deliveryAddress.state || 
        !subscriptionData.deliveryAddress.pincode) {
      alert('Please fill in all delivery address fields')
      return
    }

    try {
      setCreatingSubscription(true)
      const response = await subscriptionAPI.createSubscription({
        productId: selectedProduct._id,
        frequency: subscriptionData.frequency,
        deliveryDay: subscriptionData.deliveryDay,
        quantity: subscriptionData.quantity,
        deliveryAddress: subscriptionData.deliveryAddress,
        requireApproval: subscriptionData.requireApproval
      })

      if (response.data.success) {
        setToastMessage(`✅ Subscription created for ${selectedProduct.name}!`)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
        handleCloseSubscriptionModal()
      } else {
        setToastMessage(`❌ Failed to create subscription`)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      setToastMessage(`❌ ${error.response?.data?.error || 'Failed to create subscription'}`)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    } finally {
      setCreatingSubscription(false)
    }
  }

  if (loading) {
    return (
      <div className="customer-products">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="customer-products">
        <div className="error-message">
          <h2>❌ Error</h2>
          <p>{error}</p>
          <button onClick={loadProducts} className="btn btn-primary">Try Again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="customer-products">
      {/* Toast Notification */}
      {showToast && (
        <div className="toast-notification">
          <div className="toast-message">{toastMessage}</div>
        </div>
      )}
      
      <div className="page-header">
        <div className="header-top">
          <h1>🥬 Products Near You</h1>
          <button 
            onClick={() => window.location.href = '/customer/cart'}
            className="btn btn-primary cart-btn"
          >
            🛒 Go to Cart
          </button>
        </div>
        <p>Discover fresh products from farmers within 7km radius</p>
        
        {/* Location Permission Status */}
        <div className="location-permission">
          {locationPermission === 'prompting' && (
            <div className="permission-prompt">
              <p>📍 Enable location services to see products near you</p>
              <button 
                onClick={requestLocationPermission} 
                className="btn btn-primary location-btn"
              >
                🗺️ Enable Location
              </button>
            </div>
          )}
          
          {locationPermission === 'denied' && (
            <div className="permission-denied">
              <p>🚫 Location access denied</p>
              <p>Showing products from your profile location or all available products</p>
              <button 
                onClick={requestLocationPermission} 
                className="btn btn-outline location-btn"
              >
                🔄 Retry Location Access
              </button>
            </div>
          )}
          
          {locationPermission === 'granted' && customerLocation && (
            <div className="location-success">
              <p>📍 Location access granted</p>
              <p>Showing products near {customerLocation.city || 'your location'}</p>
            </div>
          )}
          
          {customerLocation && (
            <div className="location-info">
              📍 {customerLocation.city || 'Your Location'} - Showing nearby products
            </div>
          )}
        </div>
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="vegetables">Vegetables</option>
            <option value="fruits">Fruits</option>
            <option value="dairy">Dairy</option>
            <option value="grains">Grains</option>
            <option value="pulses">Pulses</option>
            <option value="spices">Spices</option>
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="name">Sort by Name</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      <div className="products-grid">
        {sortedProducts.length === 0 ? (
          <div className="no-products">
            <div className="no-products-icon">🥬</div>
            <h3>No Products Found</h3>
            <p>
              {customerLocation 
                ? "No products found in your area. Try expanding your search or checking back later."
                : "Enable location services to see products near you."
              }
            </p>
          </div>
        ) : (
          sortedProducts.map(product => (
            <div key={product._id} className="product-card">
              <div className="product-image">
                {product.images && product.images.length > 0 ? (
                  <img src={product.images[0]} alt={product.name} />
                ) : (
                  <div className="placeholder-image">🥬</div>
                )}
                {product.isfeatured && (
                  <div className="featured-badge">⭐ Featured</div>
                )}
              </div>

              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-description">{product.description}</p>
                
                <div className="product-meta">
                  <span className="category">{product.category}</span>
                  {product.ratingaverage > 0 && (
                    <span className="rating">⭐ {product.ratingaverage.toFixed(1)}</span>
                  )}
                </div>

                <div className="price-info">
                  <span className="price">₹{product.priceperunit}</span>
                  <span className="unit">per {product.unit}</span>
                </div>

                <div className="stock-info">
                  <span className={`stock-status ${product.isavailable ? 'available' : 'out-of-stock'}`}>
                    {product.isavailable ? `✓ ${product.stockquantity} ${product.unit} available` : 'Out of Stock'}
                  </span>
                </div>

                <div className="farmer-info">
                  <div className="farmer-details">
                    <span className="farmer-name">👨‍🌾 {product.farmer?.users?.name || 'Local Farmer'}</span>
                    {product.farmer?.farmname && (
                      <span className="farm-name">🌾 {product.farmer.farmname}</span>
                    )}
                  </div>
                  <div className="distance">
                    📍 {calculateDistance(product)}
                  </div>
                </div>
              </div>

              <div className="product-actions">
                <Link to={`/customer/product/${product._id}`} className="btn btn-outline">
                  View Details
                </Link>
                <button 
                  className={`btn ${addedProducts[product._id] ? 'btn-success' : 'btn-primary'}`}
                  disabled={!product.isavailable || addingToCart[product._id] || addedProducts[product._id]}
                  onClick={() => handleAddToCart(product)}
                >
                  {addingToCart[product._id] ? 'Adding...' : 
                   addedProducts[product._id] ? '✅ Added to cart' : 
                   (product.isavailable ? 'Add to Cart' : 'Out of Stock')}
                </button>
                <button 
                  className="btn btn-subscription"
                  disabled={!product.isavailable}
                  onClick={() => handleOpenSubscriptionModal(product)}
                >
                  🔄 Subscribe
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="subscription-modal">
            <div className="modal-header">
              <h3>🔄 Subscribe to {selectedProduct.name}</h3>
              <button className="close-btn" onClick={handleCloseSubscriptionModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="product-info">
                <p><strong>Price:</strong> ₹{selectedProduct.priceperUnit}/{selectedProduct.unit}</p>
                <p><strong>Farmer:</strong> {selectedProduct.farmerName || 'Local Farmer'}</p>
              </div>

              <div className="form-group">
                <label>Frequency:</label>
                <select 
                  value={subscriptionData.frequency}
                  onChange={(e) => setSubscriptionData(prev => ({...prev, frequency: e.target.value}))}
                >
                  <option value="WEEKLY">Weekly</option>
                  <option value="BIWEEKLY">Bi-weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>

              <div className="form-group">
                <label>Delivery Day:</label>
                <select 
                  value={subscriptionData.deliveryDay}
                  onChange={(e) => setSubscriptionData(prev => ({...prev, deliveryDay: e.target.value}))}
                >
                  <option value="MONDAY">Monday</option>
                  <option value="TUESDAY">Tuesday</option>
                  <option value="WEDNESDAY">Wednesday</option>
                  <option value="THURSDAY">Thursday</option>
                  <option value="FRIDAY">Friday</option>
                  <option value="SATURDAY">Saturday</option>
                  <option value="SUNDAY">Sunday</option>
                </select>
              </div>

              <div className="form-group">
                <label>Quantity ({selectedProduct.unit}):</label>
                <input 
                  type="number" 
                  min="1"
                  value={subscriptionData.quantity}
                  onChange={(e) => setSubscriptionData(prev => ({...prev, quantity: parseInt(e.target.value) || 1}))}
                />
              </div>

              <div className="form-group">
                <label>Delivery Address:</label>
                
                {/* Address Option Selection */}
                <div className="address-options">
                  <label className="radio-option">
                    <input 
                      type="radio"
                      name="addressOption"
                      value="default"
                      checked={subscriptionData.addressOption === 'default'}
                      onChange={() => handleAddressOptionChange('default')}
                      disabled={!defaultAddress}
                    />
                    Use Default Address
                  </label>
                  <label className="radio-option">
                    <input 
                      type="radio"
                      name="addressOption"
                      value="new"
                      checked={subscriptionData.addressOption === 'new'}
                      onChange={() => handleAddressOptionChange('new')}
                    />
                    Enter New Address
                  </label>
                </div>

                {subscriptionData.addressOption === 'default' && defaultAddress ? (
                  <div className="default-address-display">
                    <p><strong>Street:</strong> {defaultAddress.street || 'N/A'}</p>
                    <p><strong>Door No:</strong> {defaultAddress.doorNo || 'N/A'}</p>
                    <p><strong>City:</strong> {defaultAddress.city || 'N/A'}</p>
                    <p><strong>State:</strong> {defaultAddress.state || 'N/A'}</p>
                    <p><strong>Pincode:</strong> {defaultAddress.pincode || 'N/A'}</p>
                  </div>
                ) : (
                  <div className="new-address-form">
                    <div className="location-detection">
                      <button 
                        type="button"
                        className="btn btn-outline detect-location-btn"
                        onClick={detectCurrentLocation}
                        disabled={detectingLocation}
                      >
                        {detectingLocation ? '🔄 Detecting...' : '📍 Detect Current Location'}
                      </button>
                      <small>We'll auto-fill city, state, pincode, and coordinates</small>
                    </div>

                    <div className="address-inputs">
                      <div className="address-row">
                        <input 
                          type="text" 
                          placeholder="Door/Flat No."
                          value={subscriptionData.deliveryAddress.doorNo}
                          onChange={(e) => setSubscriptionData(prev => ({
                            ...prev, 
                            deliveryAddress: {...prev.deliveryAddress, doorNo: e.target.value}
                          }))}
                        />
                        <input 
                          type="text" 
                          placeholder="Street Address*"
                          value={subscriptionData.deliveryAddress.street}
                          onChange={(e) => setSubscriptionData(prev => ({
                            ...prev, 
                            deliveryAddress: {...prev.deliveryAddress, street: e.target.value}
                          }))}
                        />
                      </div>
                      
                      <div className="address-row">
                        <input 
                          type="text" 
                          placeholder="City*"
                          value={subscriptionData.deliveryAddress.city}
                          onChange={(e) => setSubscriptionData(prev => ({
                            ...prev, 
                            deliveryAddress: {...prev.deliveryAddress, city: e.target.value}
                          }))}
                        />
                        <input 
                          type="text" 
                          placeholder="State*"
                          value={subscriptionData.deliveryAddress.state}
                          onChange={(e) => setSubscriptionData(prev => ({
                            ...prev, 
                            deliveryAddress: {...prev.deliveryAddress, state: e.target.value}
                          }))}
                        />
                      </div>
                      
                      <input 
                        type="text" 
                        placeholder="Pincode*"
                        value={subscriptionData.deliveryAddress.pincode}
                        onChange={(e) => setSubscriptionData(prev => ({
                          ...prev, 
                          deliveryAddress: {...prev.deliveryAddress, pincode: e.target.value}
                        }))}
                      />
                      
                      {subscriptionData.deliveryAddress.latitude && (
                        <div className="coordinates-display">
                          <small>📍 Location detected: {subscriptionData.deliveryAddress.latitude}, {subscriptionData.deliveryAddress.longitude}</small>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>
                  <input 
                    type="checkbox"
                    checked={subscriptionData.requireApproval}
                    onChange={(e) => setSubscriptionData(prev => ({...prev, requireApproval: e.target.checked}))}
                  />
                  Require approval before each delivery
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={handleCloseSubscriptionModal}>
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleCreateSubscription}
                disabled={creatingSubscription}
              >
                {creatingSubscription ? 'Creating...' : 'Create Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerProducts
