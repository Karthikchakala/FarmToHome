import { useState } from 'react'
import { cartAPI } from '../services/cartAPI'
import './CartItem.css'

const CartItem = ({ item, onRemove, onUpdate, onQuantityChange }) => {
  const [quantity, setQuantity] = useState(item.quantity)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')

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
    return null
  }

  const isImageEmoji = (url) => {
    return url && url.length <= 2
  }

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1 || newQuantity > item.stockquantity) return

    try {
      setUpdating(true)
      setError('')

      const response = await cartAPI.updateCartItem(item.product_id, newQuantity)

      if (response.data.success) {
        setQuantity(newQuantity)
        onQuantityChange(item.product_id, newQuantity)
      } else {
        setError(response.data.error || 'Failed to update quantity')
      }
    } catch (err) {
      console.error('Error updating cart item:', err)
      setError('Failed to update quantity')
    } finally {
      setUpdating(false)
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleRemove = async () => {
    try {
      const response = await cartAPI.removeFromCart(item.product_id)
      
      if (response.data.success) {
        onRemove(item.product_id)
      } else {
        setError(response.data.error || 'Failed to remove item')
      }
    } catch (err) {
      console.error('Error removing cart item:', err)
      setError('Failed to remove item')
    } finally {
      setTimeout(() => setError(''), 3000)
    }
  }

  const increaseQuantity = () => {
    if (quantity < item.stockquantity) {
      handleQuantityChange(quantity + 1)
    }
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      handleQuantityChange(quantity - 1)
    }
  }

  return (
    <div className="cart-item">
      <div className="cart-item-image">
        {getImageUrl(item.images) ? (
          isImageEmoji(getImageUrl(item.images)) ? (
            <span className="product-emoji">{getImageUrl(item.images)}</span>
          ) : (
            <img 
              src={getImageUrl(item.images)} 
              alt={item.product_name}
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
          {getImageUrl(item.images) || '🥬'}
        </span>
      </div>

      <div className="cart-item-details">
        <div className="item-header">
          <h3 className="item-name">{item.product_name}</h3>
          <button className="remove-btn" onClick={handleRemove}>
            🗑️
          </button>
        </div>

        <div className="item-meta">
          <span className="farmer-name">👨‍🌾 {item.farmer_name || 'Local Farmer'}</span>
          <span className="category">{item.category}</span>
        </div>

        {item.product_description && (
          <p className="item-description">
            {item.product_description.length > 100 
              ? `${item.product_description.substring(0, 100)}...` 
              : item.product_description}
          </p>
        )}

        <div className="item-footer">
          <div className="price-info">
            <span className="price">{formatPrice(item.priceperunit)}</span>
            <span className="subtotal">Subtotal: {formatPrice(item.subtotal)}</span>
          </div>

          <div className="quantity-controls">
            <div className="quantity-selector">
              <button 
                className="quantity-btn"
                onClick={decreaseQuantity}
                disabled={updating || quantity <= 1}
              >
                -
              </button>
              <span className="quantity-display">{quantity}</span>
              <button 
                className="quantity-btn"
                onClick={increaseQuantity}
                disabled={updating || quantity >= item.stockquantity}
              >
                +
              </button>
            </div>
            <span className="stock-info">
              {item.stockquantity <= 5 ? `Only ${item.stockquantity} left` : 'In stock'}
            </span>
          </div>
        </div>

        {error && (
          <div className="item-error">
            {error}
          </div>
        )}

        {updating && (
          <div className="item-updating">
            Updating...
          </div>
        )}
      </div>
    </div>
  )
}

export default CartItem
