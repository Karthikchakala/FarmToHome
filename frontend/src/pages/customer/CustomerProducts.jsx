import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { productAPI } from '../../services/api'
import { cartAPI } from '../../services/cartAPI'
import LoadingSpinner from '../../components/LoadingSpinner'
import './CustomerProducts.css'

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
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CustomerProducts
