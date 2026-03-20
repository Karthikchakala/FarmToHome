import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CartItem from '../../components/CartItem'
import CartSummary from '../../components/CartSummary'
import { cartAPI } from '../../services/cartAPI'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import './Cart.css'

const Cart = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [cartData, setCartData] = useState({
    items: [],
    summary: {
      totalItems: 0,
      totalAmount: 0,
      itemCount: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Wait for AuthContext to load, then check authentication
  useEffect(() => {
    if (!authLoading) {
      console.log('Cart - Auth check:', { isAuthenticated, user, authLoading })
      setCheckingAuth(false)
      if (!isAuthenticated) {
        console.log('Cart - Redirecting to login')
        navigate('/login')
        return
      }
    }
  }, [isAuthenticated, navigate, user, authLoading])

  const fetchCart = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch real cart data from backend
      const response = await cartAPI.getCart()
      
      if (response.data.success) {
        setCartData(response.data.data)
      } else {
        setError(response.data.error || 'Failed to load cart')
        // Set empty cart on error
        setCartData({
          items: [],
          summary: {
            totalItems: 0,
            totalAmount: 0,
            itemCount: 0
          }
        })
      }
    } catch (err) {
      console.error('Error fetching cart:', err)
      setError('Failed to connect to server. Please try again later.')
      // Set empty cart on error
      setCartData({
        items: [],
        summary: {
          totalItems: 0,
          totalAmount: 0,
          itemCount: 0
        }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && !checkingAuth && !authLoading) {
      console.log('Cart - Loading cart')
      fetchCart()
    }
  }, [isAuthenticated, checkingAuth, authLoading])

  // Show loading while AuthContext is loading or checking auth
  if (authLoading || checkingAuth) {
    return <LoadingSpinner size="large" text="Checking authentication..." />
  }

  const handleQuantityChange = (productId, newQuantity) => {
    setCartData(prevData => ({
      ...prevData,
      items: prevData.items.map(item => 
        item.product_id === productId 
          ? { ...item, quantity: newQuantity, subtotal: item.priceperunit * newQuantity }
          : item
      ),
      summary: {
        ...prevData.summary,
        totalItems: prevData.items.reduce((total, item) => 
          item.product_id === productId ? total + newQuantity : total + item.quantity, 0
        ),
        totalAmount: prevData.items.reduce((total, item) => 
          item.product_id === productId ? total + (item.priceperunit * newQuantity) : total + item.subtotal, 0
        )
      }
    }))
  }

  const handleRemoveItem = (productId) => {
    const removedItem = cartData.items.find(item => item.product_id === productId)
    
    setCartData(prevData => ({
      ...prevData,
      items: prevData.items.filter(item => item.product_id !== productId),
      summary: {
        ...prevData.summary,
        totalItems: prevData.summary.totalItems - (removedItem?.quantity || 0),
        totalAmount: prevData.summary.totalAmount - (removedItem?.subtotal || 0),
        itemCount: prevData.summary.itemCount - 1
      }
    }))
  }

  const handleClearCart = () => {
    setCartData({
      items: [],
      summary: {
        totalItems: 0,
        totalAmount: 0,
        itemCount: 0
      }
    })
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="cart">
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading your cart...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="cart">
        <div className="container">
          <div className="error-container">
            <h2>Cart Error</h2>
            <p>{error}</p>
            {error.includes('login') && (
              <div className="login-actions">
                <a href="/login" className="btn btn-primary">
                  🤝 Login
                </a>
                <a href="/signup" className="btn btn-outline">
                  📝 Sign Up
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cart">
      <div className="container">
        <div className="cart-header">
          <h1>Shopping Cart</h1>
          <div className="cart-stats">
            <span className="item-count">{cartData.summary.itemCount} items</span>
            <span className="total-items">{cartData.summary.totalItems} units</span>
          </div>
        </div>

        {cartData.items.length === 0 ? (
          <div className="empty-cart-container">
            <div className="empty-cart">
              <div className="empty-cart-icon">🛒</div>
              <h2>Your cart is empty</h2>
              <p>Fresh produce is waiting for you! Add some organic fruits and vegetables to get started.</p>
              <div className="empty-cart-actions">
                <a href="/products" className="btn btn-primary btn-large">
                  🥬 Shop Products
                </a>
                <a href="/" className="btn btn-outline">
                  🏠 Go Home
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              <div className="items-header">
                <h2>Items ({cartData.summary.itemCount})</h2>
                <button className="clear-all-btn" onClick={() => {
                  if (window.confirm('Are you sure you want to clear your entire cart?')) {
                    cartAPI.clearCart().then(handleClearCart).catch(console.error)
                  }
                }}>
                  🗑️ Clear All
                </button>
              </div>
              
              <div className="items-list">
                {cartData.items.map((item) => (
                  <CartItem
                    key={item._id}
                    item={item}
                    onRemove={handleRemoveItem}
                    onQuantityChange={handleQuantityChange}
                  />
                ))}
              </div>

              <div className="cart-footer">
                <div className="continue-shopping">
                  <a href="/products" className="btn btn-outline">
                    ← Continue Shopping
                  </a>
                </div>
              </div>
            </div>

            <div className="cart-sidebar">
              <CartSummary
                items={cartData.items}
                totalAmount={cartData.summary.totalAmount}
                totalItems={cartData.summary.totalItems}
                onClear={handleClearCart}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart
