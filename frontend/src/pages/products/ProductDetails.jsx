import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { productAPI } from '../../services/api'
import './ProductDetails.css'

const ProductDetails = () => {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartMessage, setCartMessage] = useState('')

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const response = await productAPI.getProductById(id)
        if (response.data.success) {
          setProduct(response.data.data.product)
        } else {
          setError(response.data.error || 'Product not found')
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const handleAddToCart = async () => {
    if (!product) return

    try {
      setAddingToCart(true)
      setCartMessage('')

      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          productId: product._id,
          quantity: quantity
        })
      })

      const data = await response.json()

      if (data.success) {
        setCartMessage('✅ Added to cart successfully!')
        // Update cart count in header if needed
        window.dispatchEvent(new Event('cartUpdated'))
      } else {
        setCartMessage(`❌ ${data.error}`)
      }
    } catch (err) {
      console.error('Error adding to cart:', err)
      setCartMessage('❌ Failed to add to cart')
    } finally {
      setAddingToCart(false)
      setTimeout(() => setCartMessage(''), 3000)
    }
  }

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change
    if (newQuantity >= 1 && product && newQuantity <= product.stockquantity) {
      setQuantity(newQuantity)
    }
  }

  const getImageUrl = (images) => {
    if (images && images.length > 0) {
      return images[0]
    }
    return null
  }

  const isImageEmoji = (url) => {
    return url && url.length <= 2
  }

  if (loading) {
    return (
      <div className="product-details">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading product details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="product-details">
        <div className="container">
          <div className="error-container">
            <h2>Product Not Found</h2>
            <p>{error}</p>
            <Link to="/products" className="btn btn-primary">
              ← Back to Products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="product-details">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/products">Products</Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>

        <div className="product-detail-layout">
          {/* Product Images */}
          <div className="product-images">
            <div className="main-image">
              {getImageUrl(product.images) ? (
                isImageEmoji(getImageUrl(product.images)) ? (
                  <span className="product-emoji-large">{getImageUrl(product.images)}</span>
                ) : (
                  <img 
                    src={getImageUrl(product.images)} 
                    alt={product.name}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                )
              ) : (
                <div className="no-image">
                  <span>🥬</span>
                </div>
              )}
              <span className="product-emoji-fallback" style={{ display: 'none' }}>
                {getImageUrl(product.images) || '🥬'}
              </span>
            </div>
            
            {/* Additional images */}
            {product.images && product.images.length > 1 && (
              <div className="thumbnail-images">
                {product.images.slice(1, 4).map((image, index) => (
                  <div key={index} className="thumbnail">
                    {isImageEmoji(image) ? (
                      <span>{image}</span>
                    ) : (
                      <img src={image} alt={`${product.name} ${index + 2}`} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="product-info">
            <div className="product-header">
              <h1>{product.name}</h1>
              <div className="product-meta">
                <span className="category-badge">{product.category}</span>
                <span className="unit-badge">Per {product.unit}</span>
              </div>
            </div>

            {/* Farmer Information */}
            {(product.farmer_name || product.farmname) && (
              <div className="farmer-info">
                <div className="farmer-header">
                  <span className="farmer-icon">👨‍🌾</span>
                  <div>
                    <h3>{product.farmname || 'Local Farm'}</h3>
                    <p>by {product.farmer_name || 'Local Farmer'}</p>
                  </div>
                </div>
                {product.ratingaverage && (
                  <div className="farmer-rating">
                    <span className="stars">⭐</span>
                    <span>{product.ratingaverage.toFixed(1)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Price and Stock */}
            <div className="price-section">
              <div className="price-info">
                <span className="current-price">{formatPrice(product.priceperunit)}</span>
                <span className="price-unit">per {product.unit}</span>
              </div>
              <div className="stock-info">
                {product.stockquantity > 10 ? (
                  <span className="in-stock">✅ In Stock ({product.stockquantity} available)</span>
                ) : product.stockquantity > 0 ? (
                  <span className="low-stock">⚠️ Only {product.stockquantity} left</span>
                ) : (
                  <span className="out-of-stock">❌ Out of Stock</span>
                )}
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="description-section">
                <h3>Description</h3>
                <p>{product.description}</p>
              </div>
            )}

            {/* Additional Details */}
            <div className="details-section">
              <h3>Product Details</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Category:</span>
                  <span className="detail-value">{product.category}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Unit:</span>
                  <span className="detail-value">{product.unit}</span>
                </div>
                {product.minorderquantity && (
                  <div className="detail-item">
                    <span className="detail-label">Min Order:</span>
                    <span className="detail-value">{product.minorderquantity} {product.unit}</span>
                  </div>
                )}
                {product.harvestdate && (
                  <div className="detail-item">
                    <span className="detail-label">Harvested:</span>
                    <span className="detail-value">{new Date(product.harvestdate).toLocaleDateString()}</span>
                  </div>
                )}
                {product.expirydate && (
                  <div className="detail-item">
                    <span className="detail-label">Best Before:</span>
                    <span className="detail-value">{new Date(product.expirydate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Add to Cart Section */}
            <div className="add-to-cart-section">
              <div className="quantity-selector">
                <label>Quantity:</label>
                <div className="quantity-controls">
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      if (val >= 1 && val <= product.stockquantity) {
                        setQuantity(val)
                      }
                    }}
                    min="1"
                    max={product.stockquantity}
                  />
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stockquantity}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                className="btn btn-primary btn-large add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={product.stockquantity === 0 || addingToCart}
              >
                {addingToCart ? (
                  <>
                    <div className="btn-spinner"></div>
                    Adding...
                  </>
                ) : product.stockquantity === 0 ? (
                  'Out of Stock'
                ) : (
                  '🛒 Add to Cart'
                )}
              </button>

              {cartMessage && (
                <div className={`cart-message ${cartMessage.includes('✅') ? 'success' : 'error'}`}>
                  {cartMessage}
                </div>
              )}
            </div>

            {/* Trust Badges */}
            <div className="trust-badges">
              <div className="badge">
                <span className="badge-icon">🌱</span>
                <span className="badge-text">100% Organic</span>
              </div>
              <div className="badge">
                <span className="badge-icon">🚚</span>
                <span className="badge-text">Fast Delivery</span>
              </div>
              <div className="badge">
                <span className="badge-icon">💰</span>
                <span className="badge-text">Fair Price</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <section className="related-products">
          <h2>You May Also Like</h2>
          <div className="related-grid">
            {/* Placeholder for related products */}
            <div className="placeholder-text">More products coming soon...</div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default ProductDetails
