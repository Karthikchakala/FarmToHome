import { Link } from 'react-router-dom'
import { cartAPI } from '../services/cartAPI'
import './CartSummary.css'

const CartSummary = ({ items, totalAmount, totalItems, onClear }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your entire cart?')) {
      try {
        await cartAPI.clearCart()
        onClear()
      } catch (error) {
        console.error('Error clearing cart:', error)
        alert('Failed to clear cart. Please try again.')
      }
    }
  }

  const deliveryCharge = totalAmount > 500 ? 0 : 40
  const platformCommission = Math.round(totalAmount * 0.05) // 5% commission
  const totalDiscount = deliveryCharge + platformCommission
  const finalAmount = totalAmount

  return (
    <div className="cart-summary">
      <div className="summary-header">
        <h3>Order Summary</h3>
        {items.length > 0 && (
          <button className="clear-cart-btn" onClick={handleClearCart}>
            🗑️ Clear Cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h4>Your cart is empty</h4>
          <p>Add some fresh produce to get started!</p>
          <Link to="/products" className="btn btn-primary">
            🥬 Shop Products
          </Link>
        </div>
      ) : (
        <div className="summary-content">
          <div className="summary-items">
            <div className="summary-row">
              <span>Items ({totalItems})</span>
              <span>{formatPrice(totalAmount + totalDiscount)}</span>
            </div>

            {platformCommission > 0 && (
              <div className="summary-row discount-row">
                <span>Platform Fee Discount</span>
                <span className="discount-text">-{formatPrice(platformCommission)}</span>
              </div>
            )}

            {deliveryCharge > 0 && (
              <div className="summary-row discount-row">
                <span>Delivery Fee Discount</span>
                <span className="discount-text">-{formatPrice(deliveryCharge)}</span>
              </div>
            )}

            {totalDiscount > 0 && (
              <div className="summary-row total-discount-row">
                <span>Total Savings</span>
                <span className="total-discount-text">-{formatPrice(totalDiscount)}</span>
              </div>
            )}
          </div>

          <div className="summary-total">
            <div className="total-row">
              <span>Total Amount</span>
              <span className="total-amount">{formatPrice(finalAmount)}</span>
            </div>
          </div>

          <div className="summary-actions">
            <Link to="/checkout" className="btn btn-primary btn-large checkout-btn">
              🛍️ Proceed to Checkout
            </Link>
          </div>

          <div className="trust-badges">
            <div className="badge">
              <span className="badge-icon">🔒</span>
              <span className="badge-text">Secure Payment</span>
            </div>
            <div className="badge">
              <span className="badge-icon">🚚</span>
              <span className="badge-text">Fast Delivery</span>
            </div>
            <div className="badge">
              <span className="badge-icon">💰</span>
              <span className="badge-text">Cash on Delivery</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CartSummary
