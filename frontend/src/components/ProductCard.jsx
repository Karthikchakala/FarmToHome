import { Link } from 'react-router-dom'
import { cartAPI } from '../services/api'
import { useState } from 'react'
import StockBadge from './StockBadge'
import './ProductCard.css'

const ProductCard = ({ product }) => {
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartMessage, setCartMessage] = useState('')

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getImageUrl = (images) => {
    if (images && images.length > 0) {
      return images[0]
    }
    // Return emoji based on category as fallback
    const categoryEmojis = {
      'vegetables': '🥬',
      'fruits': '🍎',
      'dairy': '🥛',
      'grains': '🌾',
      'herbs': '🌿',
      'flowers': '🌻',
    }
    return categoryEmojis[product.category?.toLowerCase()] || '🥬'
  }

  const isImageEmoji = (url) => {
    return url && url.length <= 2 // Simple check for emoji
  }

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Check if product is available and has stock
    if (!product.isavailable || product.stockquantity <= 0) {
      setCartMessage('❌ Not available')
      setTimeout(() => setCartMessage(''), 2000)
      return
    }

    try {
      setAddingToCart(true)
      setCartMessage('')

      const response = await cartAPI.addToCart(product._id, 1)

      if (response.data.success) {
        setCartMessage('✅ Added!')
        // Update cart count in header
        window.dispatchEvent(new Event('cartUpdated'))
      } else {
        setCartMessage(`❌ ${response.data.error}`)
      }
    } catch (err) {
      console.error('Error adding to cart:', err)
      setCartMessage('❌ Failed')
    } finally {
      setAddingToCart(false)
      setTimeout(() => setCartMessage(''), 2000)
    }
  }

  const isOutOfStock = !product.isavailable || product.stockquantity <= 0

  return (
    <div className="product-card">
      <Link to={`/products/${product._id}`} className="product-link">
        <div className="product-image">
          {isImageEmoji(getImageUrl(product.images)) ? (
            <span className="product-emoji">{getImageUrl(product.images)}</span>
          ) : (
            <img 
              src={getImageUrl(product.images)} 
              alt={product.name}
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
          )}
          <span className="product-emoji-fallback" style={{ display: 'none' }}>
            {getImageUrl(product.images)}
          </span>
          
          <StockBadge 
            stockQuantity={product.stockquantity} 
            isAvailable={product.isavailable}
            showText={false}
          />
        </div>
        
        <div className="product-info">
          <div className="product-header">
            <h3 className="product-name">{product.name}</h3>
            {product.farmer_name && (
              <div className="farmer-info">
                <span className="farmer-name">👨‍🌾 {product.farmer_name}</span>
                {product.ratingaverage && (
                  <span className="farmer-rating">
                    ⭐ {product.ratingaverage.toFixed(1)}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {product.description && (
            <p className="product-description">
              {product.description.length > 80 
                ? `${product.description.substring(0, 80)}...` 
                : product.description}
            </p>
          )}
          
          <div className="product-meta">
            <span className="product-category">{product.category}</span>
            <span className="product-unit">per {product.unit}</span>
          </div>
          
          <div className="product-footer">
            <div className="price-section">
              <span className="product-price">{formatPrice(product.priceperunit)}</span>
              <StockBadge 
                stockQuantity={product.stockquantity} 
                isAvailable={product.isavailable}
                showText={true}
              />
              {product.minorderquantity && product.minorderquantity > 1 && (
                <span className="min-order">Min: {product.minorderquantity} {product.unit}</span>
              )}
            </div>
          </div>
        </div>
      </Link>

      <div className="product-actions">
        <button 
          className="btn btn-primary btn-small add-to-cart"
          onClick={handleAddToCart}
          disabled={addingToCart || isOutOfStock}
        >
          {addingToCart ? (
            <div className="btn-spinner"></div>
          ) : isOutOfStock ? (
            'Out of Stock'
          ) : (
            '🛒 Add'
          )}
        </button>
        
        {cartMessage && (
          <div className={`cart-message ${cartMessage.includes('✅') ? 'success' : 'error'}`}>
            {cartMessage}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductCard
