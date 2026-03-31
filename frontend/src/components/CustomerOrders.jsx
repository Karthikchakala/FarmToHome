import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { orderAPI } from '../services/orderAPI'
import LoadingSpinner from './LoadingSpinner'
import ReviewForm from './ReviewForm'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './CustomerOrders.css'

const CustomerOrders = () => {
  const { user, isAuthenticated } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [cancellingOrderId, setCancellingOrderId] = useState(null)
  const [previousStatuses, setPreviousStatuses] = useState({})
  const [showReviewForm, setShowReviewForm] = useState({})
  const [reviewedOrders, setReviewedOrders] = useState(new Set())

  console.log('CustomerOrders: Component rendered', { isAuthenticated, user })

  const statusOptions = [
    { value: 'PLACED', label: '📋 Placed', color: '#FFA500' },
    { value: 'CONFIRMED', label: '✅ Confirmed', color: '#4CAF50' },
    { value: 'PACKED', label: '👨‍🍳 Packed', color: '#2196F3' },
    { value: 'OUT_FOR_DELIVERY', label: '🚚 Out for Delivery', color: '#9C27B0' },
    { value: 'DELIVERED', label: '🎉 Delivered', color: '#8BC34A' },
    { value: 'CANCELLED', label: '❌ Cancelled', color: '#F44336' }
  ]

  // Check for status changes and show notifications
  const checkStatusChanges = (newOrders) => {
    newOrders.forEach(order => {
      const previousStatus = previousStatuses[order._id]
      const currentStatus = order.status
      
      if (previousStatus && previousStatus !== currentStatus) {
        const statusOption = statusOptions.find(s => s.value === currentStatus)
        if (statusOption) {
          toast.success(`Order #${order.ordernumber} status updated to: ${statusOption.label}`, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          })
        }
      }
    })
    
    // Update previous statuses
    const newPreviousStatuses = {}
    newOrders.forEach(order => {
      newPreviousStatuses[order._id] = order.status
    })
    setPreviousStatuses(newPreviousStatuses)
  }

  // Review form handlers
  const handleShowReviewForm = (orderId) => {
    setShowReviewForm(prev => ({ ...prev, [orderId]: true }))
  }

  const handleHideReviewForm = (orderId) => {
    setShowReviewForm(prev => ({ ...prev, [orderId]: false }))
  }

  const handleReviewSubmitted = (orderId) => {
    setReviewedOrders(prev => new Set([...prev, orderId]))
    setShowReviewForm(prev => ({ ...prev, [orderId]: false }))
    toast.success('Review submitted successfully!', {
      position: "top-right",
      autoClose: 3000,
    })
  }

  const canReviewOrder = (order) => {
    // Can only review delivered orders that haven't been reviewed yet
    return order.status === 'DELIVERED' && !reviewedOrders.has(order._id)
  }

  console.log('CustomerOrders: Status options defined', statusOptions.length)

  useEffect(() => {
    if (isAuthenticated && user?.role === 'customer') {
      fetchOrders()
    }
  }, [isAuthenticated, user])

  const fetchOrders = async () => {
    console.log('CustomerOrders: fetchOrders called')
    try {
      setLoading(true)
      setError('')
      const response = await orderAPI.getUserOrders()
      
      console.log('CustomerOrders: API response', response)
      
      if (response.data.success) {
        const ordersData = response.data.data || []
        console.log('CustomerOrders: Orders fetched', ordersData.length, ordersData)
        
        // Check for status changes and show notifications
        checkStatusChanges(ordersData)
        
        setOrders(ordersData)
      } else {
        console.log('CustomerOrders: API error', response.data.error)
        setError(response.data.error || 'Failed to fetch orders')
      }
    } catch (error) {
      console.error('CustomerOrders: Fetch error', error)
      setError('Failed to fetch orders')
    } finally {
      console.log('CustomerOrders: Loading finished')
      setLoading(false)
    }
  }

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return
    }

    try {
      setCancellingOrderId(orderId)
      setError('')
      setSuccess('')
      
      const response = await orderAPI.customerCancelOrder(orderId)
      
      if (response.data.success) {
        setSuccess('Order cancelled successfully!')
        // Update the order in the local state
        setOrders(prev => prev.map(order => 
          order._id === orderId 
            ? { ...order, status: 'cancelled', cancelledat: new Date().toISOString() }
            : order
        ))
      } else {
        setError(response.data.error || 'Failed to cancel order')
      }
    } catch (error) {
      console.error('Error cancelling order:', error)
      setError('Failed to cancel order. Please try again.')
    } finally {
      setCancellingOrderId(null)
    }
  }

  const canCancelOrder = (order) => {
    const cancellableStatuses = ['pending', 'confirmed']
    return cancellableStatuses.includes(order.status)
  }

  const getStatusBadge = (status) => {
    // Normalize status to match our statusOptions
    const normalizedStatus = status?.toUpperCase?.() || status
    
    const statusOption = statusOptions.find(s => 
      s.value === normalizedStatus || 
      s.value === status ||
      s.value.toLowerCase() === status?.toLowerCase?.()
    ) || statusOptions[0]
    
    return (
      <span 
        className="status-badge" 
        style={{ backgroundColor: statusOption.color }}
      >
        {statusOption.label}
      </span>
    )
  }

  const getTimelineStatus = (orderStatus) => {
    // Normalize status to match our statusOptions
    const normalizedStatus = orderStatus?.toUpperCase?.() || orderStatus
    
    // Debug logging
    console.log('Order Status Debug:', { 
      originalStatus: orderStatus, 
      normalizedStatus,
      availableOptions: statusOptions.map(s => s.value)
    })
    
    return statusOptions.find(s => 
      s.value === normalizedStatus || 
      s.value === orderStatus ||
      s.value.toLowerCase() === orderStatus?.toLowerCase?.()
    ) || statusOptions[0]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="customer-orders">
        <div className="auth-message">
          <h2>Please login to view your orders</h2>
        </div>
      </div>
    )
  }

  if (user?.role !== 'customer') {
    return (
      <div className="customer-orders">
        <div className="auth-message">
          <h2>Access Denied</h2>
          <p>This page is only available for customers.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    console.log('CustomerOrders: Loading state')
    return (
      <div className="customer-orders">
        <LoadingSpinner size="large" text="Loading your orders..." />
      </div>
    )
  }

  console.log('CustomerOrders: Rendering orders:', orders.length)

  return (
    <div className="customer-orders">
      {/* Component Test - Should always be visible */}
      <div style={{background: 'lightgreen', padding: '10px', margin: '10px 0', fontSize: '14px', fontWeight: 'bold'}}>
        ✅ CustomerOrders Component Loaded Successfully!
      </div>
      
      {/* CSS Test - Should be red if CSS is loading */}
      <div className="css-test">
        CSS TEST: This should have RED background if CustomerOrders.css is loading properly
      </div>
      
      <div className="orders-header">
        <h2>My Orders</h2>
        <p>Track and manage your orders</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          {success}
        </div>
      )}

      <div className="orders-container">
        {orders.length === 0 ? (
          <div className="no-orders">
            <div className="no-orders-icon">📦</div>
            <h3>No Orders Yet</h3>
            <p>You haven't placed any orders yet. Start shopping to see your orders here!</p>
          </div>
        ) : (
          <div className="orders-list">
            {/* Test timeline - always show to verify CSS is working */}
            <div style={{background: 'lightblue', padding: '20px', margin: '20px 0'}}>
              <h3>TEST TIMELINE - Should Always Show</h3>
              <div style={{
                padding: '20px',
                borderTop: '1px solid #e9ecef',
                background: '#fafbfc'
              }}>
                <h4 style={{
                  margin: '0 0 15px 0',
                  color: '#333',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Test Order Timeline</h4>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}>
                  <div style={{
                    content: '',
                    position: 'absolute',
                    top: '12px',
                    left: '0',
                    right: '0',
                    height: '2px',
                    background: '#e9ecef',
                    zIndex: '1'
                  }}></div>
                  {statusOptions.slice(0, -1).map((status, index) => {
                    const isCompleted = index < 2 // First 2 items as completed
                    const isCurrent = index === 2 // 3rd item as current
                    
                    return (
                      <div key={status.value} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative',
                        zIndex: '2',
                        flex: '1'
                      }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: isCompleted ? '#27ae60' : isCurrent ? '#3498db' : '#e9ecef',
                          border: '3px solid white',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                          marginBottom: '8px',
                          transition: 'all 0.3s ease',
                          animation: isCurrent ? 'pulse 2s infinite' : 'none'
                        }}></div>
                        <div style={{
                          textAlign: 'center',
                          fontSize: '11px',
                          color: isCompleted ? '#27ae60' : isCurrent ? '#3498db' : '#666',
                          fontWeight: isCompleted || isCurrent ? '600' : 'normal',
                          maxWidth: '80px'
                        }}>
                          {status.label}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            
            {orders.map(order => {
              console.log('CustomerOrders: Rendering order', {
                id: order._id,
                status: order.status,
                orderNumber: order.ordernumber,
                hasItems: !!order.items,
                itemCount: order.items?.length
              })
              
              console.log('CustomerOrders: Timeline status check', {
                orderStatus: order.status,
                statusOptions: statusOptions.map(s => s.value),
                willShowTimeline: true
              })
              
              return (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3>Order #{order.ordernumber}</h3>
                    <p className="order-date">{formatDate(order.createdat)}</p>
                  </div>
                  <div className="order-status">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                <div className="order-details">
                  <div className="order-items">
                    <h4>Items ({order.items?.length || 0})</h4>
                    {order.items?.slice(0, 3).map((item, index) => (
                      <div key={index} className="order-item">
                        <span className="item-name">{item.products?.name}</span>
                        <span className="item-quantity">× {item.quantity}</span>
                        <span className="item-price">${item.products?.price}</span>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <p className="more-items">+{order.items.length - 3} more items</p>
                    )}
                  </div>

                  <div className="order-summary">
                    <div className="total-amount">
                      <span>Total:</span>
                      <span className="amount">${order.totalamount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="order-actions">
                  <button className="btn btn-outline">
                    View Details
                  </button>
                  
                  {canCancelOrder(order) && (
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleCancelOrder(order._id)}
                      disabled={cancellingOrderId === order._id}
                    >
                      {cancellingOrderId === order._id ? (
                        <>
                          <span className="spinner"></span>
                          Cancelling...
                        </>
                      ) : (
                        'Cancel Order'
                      )}
                    </button>
                  )}
                  
                  {!canCancelOrder(order) && order.status !== 'cancelled' && (
                    <button className="btn btn-disabled" disabled>
                      Cannot Cancel
                    </button>
                  )}
                </div>

                {/* Simple Text-based Timeline */}
                <div style={{
                  background: '#f8f9fa',
                  padding: '15px',
                  margin: '15px 0',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#495057' }}>
                    📍 Order Status Timeline
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {statusOptions.slice(0, -1).map((status, index) => {
                      const currentStatusIndex = statusOptions.findIndex(s => s.value === order.status)
                      const isCompleted = currentStatusIndex >= index
                      const isCurrent = status.value === order.status
                      
                      return (
                        <div key={status.value} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: isCompleted ? '#28a745' : isCurrent ? '#007bff' : '#6c757d',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {isCompleted ? '✓' : index + 1}
                          </div>
                          <span style={{
                            fontSize: '12px',
                            color: isCompleted ? '#28a745' : isCurrent ? '#007bff' : '#6c757d',
                            fontWeight: isCurrent ? 'bold' : 'normal'
                          }}>
                            {status.label}
                          </span>
                          {index < statusOptions.slice(0, -1).length - 1 && (
                            <span style={{ color: '#6c757d' }}>→</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#6c757d' }}>
                    Current Status: <strong>{statusOptions.find(s => s.value === order.status)?.label}</strong>
                  </div>
                </div>

                {/* Review Section */}
                {canReviewOrder(order) && (
                  <div style={{
                    background: '#f8f9fa',
                    padding: '15px',
                    margin: '15px 0',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#495057' }}>
                      ⭐ Rate Your Experience
                    </h4>
                    <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#6c757d' }}>
                      Your order has been delivered! Please share your feedback about the products and service.
                    </p>
                    {!showReviewForm[order._id] ? (
                      <button
                        onClick={() => handleShowReviewForm(order._id)}
                        style={{
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        Write a Review
                      </button>
                    ) : (
                      <div>
                        <ReviewForm
                          farmerId={order.farmerid}
                          orderId={order._id}
                          farmerName={order.farmername || 'Farmer'}
                          orderNumber={order.ordernumber}
                          onReviewSubmitted={() => handleReviewSubmitted(order._id)}
                          onCancel={() => handleHideReviewForm(order._id)}
                        />
                      </div>
                    )}
                  </div>
                )}

                {reviewedOrders.has(order._id) && (
                  <div style={{
                    background: '#d4edda',
                    padding: '10px 15px',
                    margin: '15px 0',
                    borderRadius: '8px',
                    border: '1px solid #c3e6cb'
                  }}>
                    <p style={{ margin: '0', fontSize: '12px', color: '#155724' }}>
                      ✅ Thank you! Your review for order #{order.ordernumber} has been submitted.
                    </p>
                  </div>
                )}

                {order.status === 'cancelled' && order.cancelledat && (
                  <div className="cancellation-info">
                    <p>
                      <strong>Cancelled on:</strong> {formatDate(order.cancelledat)}
                    </p>
                    {order.cancellationreason && (
                      <p>
                        <strong>Reason:</strong> {order.cancellationreason}
                      </p>
                    )}
                  </div>
                )}

                {!canCancelOrder(order) && order.status !== 'cancelled' && (
                  <div className="cancel-info">
                    <p>
                      <small>
                        Orders can only be cancelled before preparation starts. 
                        Current status: <strong>{order.status}</strong>
                      </small>
                    </p>
                  </div>
                )}
              </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomerOrders
