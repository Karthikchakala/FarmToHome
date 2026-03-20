import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './OrderSuccess.css'

const OrderSuccess = () => {
  const navigate = useNavigate()
  const [orderData, setOrderData] = useState(null)

  useEffect(() => {
    // Get order data from localStorage
    const lastOrder = localStorage.getItem('lastOrder')
    if (lastOrder) {
      setOrderData(JSON.parse(lastOrder))
      // Clear the stored order data
      localStorage.removeItem('lastOrder')
    } else {
      // If no order data, redirect to orders page
      navigate('/orders')
    }
  }, [navigate])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!orderData) {
    return (
      <div className="order-success">
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading order details...</p>
          </div>
        </div>
      </div>
    )
  }

  const { order } = orderData

  return (
    <div className="order-success">
      <div className="container">
        <div className="success-container">
          {/* Success Animation */}
          <div className="success-animation">
            <div className="success-icon">✅</div>
            <div className="success-circle"></div>
          </div>

          {/* Success Message */}
          <div className="success-content">
            <h1>Order Placed Successfully!</h1>
            <p className="success-message">
              Thank you for your order. We've received your order and will start preparing it right away.
            </p>

            {/* Order Details */}
            <div className="order-details">
              <div className="order-header">
                <div className="order-number">
                  <span className="label">Order Number:</span>
                  <span className="value">#{order.ordernumber}</span>
                </div>
                <div className="order-date">
                  <span className="label">Placed on:</span>
                  <span className="value">{formatDate(order.createdat)}</span>
                </div>
              </div>

              <div className="order-status">
                <span className="status-badge">
                  <span className="status-icon">📝</span>
                  <span className="status-text">Order Placed</span>
                </span>
                <p className="status-message">
                  Your order has been received and is being processed by our team.
                </p>
              </div>

              <div className="order-summary">
                <h3>Order Summary</h3>
                <div className="summary-items">
                  {order.items?.map((item, index) => (
                    <div key={index} className="summary-item">
                      <div className="item-info">
                        <span className="item-name">{item.productName}</span>
                        <span className="item-quantity">× {item.quantity} {item.unit}</span>
                      </div>
                      <span className="item-price">{formatPrice(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>

                <div className="summary-totals">
                  <div className="total-row">
                    <span>Subtotal:</span>
                    <span>{formatPrice(order.totalamount - order.deliverycharge - order.platformcommission)}</span>
                  </div>
                  <div className="total-row">
                    <span>Delivery Charge:</span>
                    <span>{order.deliverycharge === 0 ? 'FREE' : formatPrice(order.deliverycharge)}</span>
                  </div>
                  <div className="total-row">
                    <span>Platform Fee:</span>
                    <span>{formatPrice(order.platformcommission)}</span>
                  </div>
                  <div className="total-row grand-total">
                    <span>Total Amount:</span>
                    <span className="grand-total-amount">{formatPrice(order.totalamount)}</span>
                  </div>
                </div>
              </div>

              <div className="delivery-info">
                <h3>Delivery Information</h3>
                <div className="delivery-details">
                  <div className="detail-row">
                    <span className="detail-label">Payment Method:</span>
                    <span className="detail-value">
                      {order.paymentmethod === 'COD' ? 'Cash on Delivery' : order.paymentmethod}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Delivery Address:</span>
                    <span className="detail-value">{order.deliveryaddress}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Estimated Delivery:</span>
                    <span className="detail-value">Within 24 hours</span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="next-steps">
                <h3>What's Next?</h3>
                <div className="steps-list">
                  <div className="step-item">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h4>Order Confirmation</h4>
                      <p>You'll receive a confirmation message shortly</p>
                    </div>
                  </div>
                  <div className="step-item">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h4>Order Preparation</h4>
                      <p>Farmers will prepare your fresh produce</p>
                    </div>
                  </div>
                  <div className="step-item">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h4>Out for Delivery</h4>
                      <p>Your order will be delivered within 24 hours</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <Link to="/orders" className="btn btn-primary btn-large">
                📦 View My Orders
              </Link>
              <Link to="/products" className="btn btn-outline btn-large">
                🥬 Continue Shopping
              </Link>
            </div>

            {/* Contact Info */}
            <div className="contact-info">
              <p>
                Need help? Contact us at <a href="mailto:support@farmtotable.com">support@farmtotable.com</a> 
                or call <a href="tel:+918000000000">+91 8000 000 000</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccess
