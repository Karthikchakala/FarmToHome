import { Link } from 'react-router-dom'
import { cartAPI } from '../services/api'
import './CheckoutSummary.css'

const CheckoutSummary = ({ cartData, deliveryAddress, paymentMethod, onPlaceOrder, loading }) => {
  const { items, summary } = cartData

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const deliveryCharge = summary.totalAmount > 500 ? 0 : 40
  const platformCommission = Math.round(summary.totalAmount * 0.05) // 5% commission
  const finalAmount = summary.totalAmount + deliveryCharge + platformCommission

  const handlePlaceOrder = () => {
    if (!deliveryAddress) {
      alert('Please enter your delivery address')
      return
    }

    const orderData = {
      deliveryAddress,
      paymentMethod: paymentMethod || 'COD',
      notes: 'Order placed via website'
    }

    onPlaceOrder(orderData)
  }

  return (
    <div className="checkout-summary">
      <div className="summary-header">
        <h3>Order Summary</h3>
        <span className="item-count">{summary.itemCount} items</span>
      </div>

      {/* Order Items */}
      <div className="order-items">
        <h4>Items ({summary.totalItems} units)</h4>
        <div className="items-list">
          {items.map((item, index) => (
            <div key={index} className="summary-item">
              <div className="item-info">
                <span className="item-name">{item.product_name}</span>
                <span className="item-quantity">× {item.quantity} {item.unit}</span>
              </div>
              <span className="item-price">{formatPrice(item.subtotal)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Address */}
      <div className="delivery-section">
        <h4>Delivery Address</h4>
        <div className="address-display">
          {deliveryAddress ? (
            <p>{deliveryAddress}</p>
          ) : (
            <p className="no-address">No address provided</p>
          )}
        </div>
      </div>

      {/* Payment Method */}
      <div className="payment-section">
        <h4>Payment Method</h4>
        <div className="payment-method">
          <span className="payment-icon">💰</span>
          <span className="payment-text">
            {paymentMethod === 'COD' ? 'Cash on Delivery' : paymentMethod}
          </span>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="price-breakdown">
        <div className="breakdown-row">
          <span>Items Total</span>
          <span>{formatPrice(summary.totalAmount)}</span>
        </div>
        
        <div className="breakdown-row">
          <span>Platform Fee (5%)</span>
          <span>{formatPrice(platformCommission)}</span>
        </div>
        
        <div className="breakdown-row delivery-row">
          <span>
            Delivery Charge
            {summary.totalAmount > 500 && (
              <span className="free-delivery">FREE</span>
            )}
          </span>
          <span className={summary.totalAmount > 500 ? 'free-delivery-text' : ''}>
            {summary.totalAmount > 500 ? formatPrice(0) : formatPrice(deliveryCharge)}
          </span>
        </div>
        
        {summary.totalAmount < 500 && (
          <div className="delivery-tip">
            <span>🚚 Add {formatPrice(500 - summary.totalAmount)} more for free delivery!</span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="total-section">
        <div className="total-row">
          <span>Total Amount</span>
          <span className="total-amount">{formatPrice(finalAmount)}</span>
        </div>
      </div>

      {/* Place Order Button */}
      <div className="place-order-section">
        <button
          className="btn btn-primary btn-large place-order-btn"
          onClick={handlePlaceOrder}
          disabled={loading || !deliveryAddress || items.length === 0}
        >
          {loading ? (
            <>
              <div className="btn-spinner"></div>
              Placing Order...
            </>
          ) : (
            '🛍️ Place Order'
          )}
        </button>

        <div className="order-terms">
          <p>
            By placing this order, you agree to our 
            <Link to="/terms" className="terms-link">Terms of Service</Link> and 
            <Link to="/privacy" className="terms-link">Privacy Policy</Link>
          </p>
        </div>
      </div>

      {/* Trust Badges */}
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

      {/* Savings Info */}
      <div className="savings-info">
        {summary.totalAmount > 500 && (
          <div className="savings-message">
            <span>💰 You saved {formatPrice(deliveryCharge)} on delivery!</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default CheckoutSummary
