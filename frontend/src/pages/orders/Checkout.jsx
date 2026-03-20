import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { cartAPI, orderAPI } from '../../services/api'
import SEO from '../../components/SEO'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import Button from '../../components/Button'
import './Checkout.css'

const Checkout = () => {
  const [cartData, setCartData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [notes, setNotes] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = async () => {
    try {
      const response = await cartAPI.getCart()
      if (response.data.success) {
        setCartData(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) {
      alert('Please enter delivery address')
      return
    }

    try {
      setPlacingOrder(true)
      
      const orderData = {
        deliveryAddress: deliveryAddress.trim(),
        paymentMethod,
        notes: notes.trim() || null
      }

      const response = await orderAPI.placeOrder(orderData)
      
      if (response.data.success) {
        alert('Order placed successfully!')
        navigate('/order-success')
      } else {
        alert(response.data.error || 'Failed to place order')
      }
    } catch (error) {
      console.error('Failed to place order:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setPlacingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="checkout">
        <div className="container">
          <div className="checkout-header">
            <h1>Checkout</h1>
          </div>
          <LoadingSpinner size="large" text="Loading cart..." />
        </div>
      </div>
    )
  }

  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="checkout">
        <div className="container">
          <div className="empty-cart-container">
            <EmptyState
              title="Your cart is empty"
              description="Add some fresh produce to proceed with checkout."
              actionText="Continue Shopping"
              actionLink="/products"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO 
        title="Checkout - Farm to Table"
        description="Complete your purchase with secure checkout. Review your cart and enter delivery details."
        keywords="checkout, order, payment, delivery, farm to table"
      />
      
      <div className="checkout">
        <div className="container">
          <div className="checkout-header">
            <h1>Checkout</h1>
            <p>Complete your order details</p>
          </div>

          <div className="checkout-content">
            <div className="checkout-form">
              <div className="form-section">
                <h2>Delivery Information</h2>
                <div className="form-group">
                  <label htmlFor="deliveryAddress">Delivery Address *</label>
                  <textarea
                    id="deliveryAddress"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your complete delivery address"
                    rows={3}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Order Notes (Optional)</label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special instructions for delivery"
                    rows={2}
                  />
                </div>
              </div>

              <div className="form-section">
                <h2>Payment Method</h2>
                <div className="payment-methods">
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="payment-label">
                      <span className="payment-icon">💵</span>
                      <span className="payment-details">
                        <span className="payment-name">Cash on Delivery</span>
                        <span className="payment-desc">Pay when you receive your order</span>
                      </span>
                    </span>
                  </label>

                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="ONLINE"
                      checked={paymentMethod === 'ONLINE'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="payment-label">
                      <span className="payment-icon">💳</span>
                      <span className="payment-details">
                        <span className="payment-name">Online Payment</span>
                        <span className="payment-desc">Pay securely with credit/debit card</span>
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="checkout-summary">
              <div className="summary-card">
                <h2>Order Summary</h2>
                
                <div className="summary-items">
                  {cartData.items.map((item) => (
                    <div key={item._id} className="summary-item">
                      <div className="item-info">
                        <h4>{item.name}</h4>
                        <p>{item.quantity} {item.unit} × ₹{item.priceperunit}</p>
                      </div>
                      <div className="item-price">
                        ₹{(item.quantity * item.priceperunit).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="summary-totals">
                  <div className="total-row">
                    <span>Subtotal</span>
                    <span>₹{cartData.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="total-row">
                    <span>Delivery Charge</span>
                    <span>₹{cartData.deliveryCharge.toFixed(2)}</span>
                  </div>
                  <div className="total-row">
                    <span>Platform Fee</span>
                    <span>₹{cartData.platformCommission.toFixed(2)}</span>
                  </div>
                  <div className="total-row grand-total">
                    <span>Total</span>
                    <span>₹{cartData.finalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder || !deliveryAddress.trim()}
                  variant="primary"
                  size="large"
                  className="place-order-btn"
                >
                  {placingOrder ? 'Placing Order...' : `Place Order • ₹${cartData.finalAmount.toFixed(2)}`}
                </Button>

                <div className="checkout-actions">
                  <Button onClick={() => navigate('/cart')} variant="outline" size="small">
                    ← Back to Cart
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Checkout
