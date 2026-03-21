import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { cartAPI, orderAPI, profileAPI } from '../../services/api'
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
  const [deliveryAddressObj, setDeliveryAddressObj] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [notes, setNotes] = useState('')
  const [userProfile, setUserProfile] = useState(null)
  const [useDefaultAddress, setUseDefaultAddress] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadCart()
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const response = await profileAPI.getProfile()
      console.log('DEBUG: Profile response:', response.data)
      if (response.data.success) {
        setUserProfile(response.data.data)
        // Set default address if available
        const consumer = response.data.data?.consumers
        console.log('DEBUG: Consumer data:', consumer)
        if (consumer?.defaultaddress) {
          const addr = consumer.defaultaddress
          console.log('DEBUG: Default address:', addr)
          const addressString = `${addr.home || ''}, ${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`.replace(/^,\s*|,\s*$/, '').replace(/,\s*,/g, ',')
          setDeliveryAddress(addressString)
          // Store address object with coordinates
          const addressObj = {
            street: addr.street || addressString,
            city: addr.city || '',
            state: addr.state || '',
            pincode: addr.pincode || '',
            latitude: addr.latitude,
            longitude: addr.longitude
          }
          console.log('DEBUG: Setting address object:', addressObj)
          setDeliveryAddressObj(addressObj)
        }
      }
    } catch (error) {
      console.error('Failed to load user profile:', error)
    }
  }

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
        deliveryAddress: deliveryAddressObj || deliveryAddress.trim(),
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
                
                {/* Address Selection */}
                {userProfile?.consumers?.defaultaddress && (
                  <div className="address-selection">
                    <label className="address-option">
                      <input
                        type="radio"
                        name="addressType"
                        value="default"
                        checked={useDefaultAddress}
                        onChange={() => {
                          setUseDefaultAddress(true)
                          const addr = userProfile.consumers.defaultaddress
                          const addressString = `${addr.home || ''}, ${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`.replace(/^,\s*|,\s*$/, '').replace(/,\s*,/g, ',')
                          setDeliveryAddress(addressString)
                          // Also set the address object with coordinates
                          setDeliveryAddressObj({
                            street: addr.street || addressString,
                            city: addr.city || '',
                            state: addr.state || '',
                            pincode: addr.pincode || '',
                            latitude: addr.latitude,
                            longitude: addr.longitude
                          })
                        }}
                      />
                      <span className="address-label">
                        <span className="address-icon">🏠</span>
                        <span className="address-details">
                          <span className="address-name">Default Address</span>
                          <span className="address-text">
                            {(() => {
                              const addr = userProfile.consumers.defaultaddress
                              return `${addr.home || ''}, ${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`.replace(/^,\s*|,\s*$/, '').replace(/,\s*,/g, ',')
                            })()}
                          </span>
                        </span>
                      </span>
                    </label>

                    <label className="address-option">
                      <input
                        type="radio"
                        name="addressType"
                        value="new"
                        checked={!useDefaultAddress}
                        onChange={() => {
                          setUseDefaultAddress(false)
                          setDeliveryAddress('')
                          setDeliveryAddressObj(null) // Clear address object when entering new address
                        }}
                      />
                      <span className="address-label">
                        <span className="address-icon">✏️</span>
                        <span className="address-details">
                          <span className="address-name">Enter New Address</span>
                          <span className="address-text">Type a different delivery address</span>
                        </span>
                      </span>
                    </label>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="deliveryAddress">Delivery Address *</label>
                  <textarea
                    id="deliveryAddress"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your complete delivery address"
                    rows={3}
                    required
                    disabled={useDefaultAddress && userProfile?.consumers?.defaultaddress}
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
                        <p>{item?.quantity || 0} {item?.unit || ''} × ₹{item?.priceperunit || 0}</p>
                      </div>
                      <div className="item-price">
                        ₹{((item?.quantity || 0) * (item?.priceperunit || 0)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="summary-totals">
                  <div className="total-row">
                    <span>Subtotal</span>
                    <span>₹{(cartData?.totalAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="total-row">
                    <span>Delivery Charge</span>
                    <span>₹{(cartData?.deliveryCharge || 0).toFixed(2)}</span>
                  </div>
                  <div className="total-row">
                    <span>Platform Fee</span>
                    <span>₹{(cartData?.platformCommission || 0).toFixed(2)}</span>
                  </div>
                  <div className="total-row grand-total">
                    <span>Total</span>
                    <span>₹{(cartData?.finalAmount || 0).toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder || !deliveryAddress.trim()}
                  variant="primary"
                  size="large"
                  className="place-order-btn"
                >
                  {placingOrder ? 'Placing Order...' : `Place Order • ₹${(cartData?.finalAmount || 0).toFixed(2)}`}
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
