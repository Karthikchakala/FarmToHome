import { Link } from 'react-router-dom'
import { orderAPI } from '../services/orderAPI'
import { useState } from 'react'
import ReviewForm from './ReviewForm'
import Chat from './Chat'
import './OrderCard.css'

const OrderCard = ({ order, onUpdate }) => {
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [showChat, setShowChat] = useState(false)

  const statusOptions = [
    { value: 'PLACED', label: '📋 Placed', color: '#ffc107' },
    { value: 'CONFIRMED', label: '✅ Confirmed', color: '#17a2b8' },
    { value: 'PACKED', label: '👨‍🍳 Packed', color: '#6f42c1' },
    { value: 'OUT_FOR_DELIVERY', label: '🚚 Out for Delivery', color: '#fd7e14' },
    { value: 'DELIVERED', label: '🎉 Delivered', color: '#28a745' }
  ]

  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) {
      return '₹0'
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'N/A'
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLACED': return '#ffc107'
      case 'CONFIRMED': return '#17a2b8'
      case 'PACKED': return '#6f42c1'
      case 'OUT_FOR_DELIVERY': return '#fd7e14'
      case 'DELIVERED': return '#28a745'
      case 'CANCELLED': return '#dc3545'
      default: return '#6c757d'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PLACED': return '📝'
      case 'CONFIRMED': return '✅'
      case 'PACKED': return '👨‍🍳'
      case 'OUT_FOR_DELIVERY': return '🚚'
      case 'DELIVERED': return '✅'
      case 'CANCELLED': return '❌'
      default: return '📦'
    }
  }

  const handleCancelOrder = async () => {
    if (cancelling) return
    setShowConfirm(true)
  }

  const confirmCancel = async () => {
    setShowConfirm(false)
    
    try {
      setCancelling(true)
      setError('')

      const response = await orderAPI.customerCancelOrder(order._id)

      if (response.data.success) {
        onUpdate(order._id, 'CANCELLED')
      } else {
        setError(response.data.error || 'Failed to cancel order')
      }
    } catch (err) {
      console.error('Error cancelling order:', err)
      setError('Failed to cancel order')
    } finally {
      setCancelling(false)
      setTimeout(() => setError(''), 3000)
    }
  }

  const cancelCancel = () => {
    setShowConfirm(false)
  }

  const canReview = order.status === 'DELIVERED'

  const handleReviewSubmitted = () => {
    setReviewSubmitted(true)
    setShowReviewForm(false)
  }

  const canCancel = ['PLACED', 'CONFIRMED', 'pending', 'confirmed'].includes(order.status)

  return (
    <div className="order-card">
      <div className="order-header">
        <div className="order-info">
          <div className="order-number">
            <span className="order-id">{order.orderNumber ? `#${order.orderNumber}` : `Order ${order._id?.slice(-6)}`}</span>
            <span className="order-date">{formatDate(order.createdat || order.createdAt)}</span>
          </div>
          <div className="order-status">
            <span 
              className="status-badge" 
              style={{ backgroundColor: getStatusColor(order.status) }}
            >
              <span className="status-icon">{getStatusIcon(order.status)}</span>
              <span className="status-text">{order.status.replace('_', ' ')}</span>
            </span>
          </div>
        </div>
        
        <div className="order-actions">
          <Link to={`/orders/${order._id}`} className="btn btn-outline btn-small">
            View Details
          </Link>
          {canCancel && (
            <button
              className="btn btn-danger btn-small"
              onClick={handleCancelOrder}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling...' : 'Cancel'}
            </button>
          )}
        </div>
      </div>

      <div className="order-timeline">
        <h4>Order Timeline</h4>
        <div className="timeline">
          {statusOptions.map((status, index) => {
            const orderIndex = statusOptions.findIndex(s => s.value === order.status)
            const isCompleted = orderIndex >= index
            const isCurrent = status.value === order.status
            return (
              <div
                key={status.value}
                className={`timeline-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
              >
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <span className="timeline-label">{status.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {canReview && (
        <div className="order-review">
          {!reviewSubmitted ? (
            !showReviewForm ? (
              <div className="review-actions">
                <button
                  className="btn btn-success btn-small"
                  onClick={() => setShowReviewForm(true)}
                >
                  Write Review
                </button>
              </div>
            ) : (
              <ReviewForm
                farmerId={order.farmerId}
                orderId={order._id}
                farmerName={order.farmerName}
                orderNumber={order.orderNumber}
                onReviewSubmitted={handleReviewSubmitted}
                onCancel={() => setShowReviewForm(false)}
              />
            )
          ) : (
            <div className="review-submitted">
              ✅ Review submitted
            </div>
          )}
        </div>
      )}

      {/* Show Chat button only for active orders (not delivered or cancelled) */}
      {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
        <div className="order-chat">
          <button
            className="btn btn-primary btn-small chat-btn"
            onClick={() => setShowChat(true)}
          >
            💬 Chat with Farmer
          </button>
        </div>
      )}

      {showChat && (
        <div className="chat-overlay">
          <Chat
            orderId={order._id}
            onClose={() => setShowChat(false)}
          />
        </div>
      )}

      <div className="order-content">
        <div className="order-items-preview">
          <div className="items-header">
            <span className="items-count">{order.items?.length || 0} items</span>
            <span className="total-amount">{formatPrice(order.totalamount || order.totalAmount)}</span>
          </div>
          
          {order.items && order.items.length > 0 && (
            <div className="items-list">
              {order.items.slice(0, 3).map((item, index) => (
                <div key={index} className="order-item">
                  <span className="item-name">{item.productName}</span>
                  <span className="item-quantity">×{item.quantity}</span>
                </div>
              ))}
              {order.items.length > 3 && (
                <div className="more-items">
                  +{order.items.length - 3} more items
                </div>
              )}
            </div>
          )}
        </div>

        <div className="order-details">
          <div className="detail-row">
            <span className="detail-label">Total Amount:</span>
            <span className="detail-value">{formatPrice(order.finalamount || order.finalAmount || order.totalamount)}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Payment:</span>
            <span className="detail-value">
              {order.paymentmethod === 'COD' ? 'Cash on Delivery' : (order.paymentmethod || order.paymentMethod)}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Delivery:</span>
            <span className="detail-value">
              {(order.deliverycharge === 0 || order.deliveryCharge === 0) ? 'FREE' : formatPrice(order.deliverycharge || order.deliveryCharge)}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Platform Fee:</span>
            <span className="detail-value">{formatPrice(order.platformcommission || order.platformCommission)}</span>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <div className="confirm-icon">⚠️</div>
            <h3 className="confirm-title">Cancel Order</h3>
            <p className="confirm-message">
              Are you sure you want to cancel order <strong>{order.ordernumber ? `#${order.ordernumber}` : `Order ${order._id?.slice(-6)}`}</strong>?
              <br /><br />
              This action <strong>cannot be undone</strong>.
            </p>
            <div className="confirm-actions">
              <button 
                className="btn btn-outline" 
                onClick={cancelCancel}
                disabled={cancelling}
              >
                No, Keep Order
              </button>
              <button 
                className="btn btn-danger" 
                onClick={confirmCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {order.status_message && (
        <div className="status-message">
          <span className="message-icon">ℹ️</span>
          <span className="message-text">{order.status_message}</span>
        </div>
      )}

      {error && (
        <div className="order-error">
          {error}
        </div>
      )}

      {order.notes && (
        <div className="order-notes">
          <span className="notes-label">Notes:</span>
          <span className="notes-text">{order.notes}</span>
        </div>
      )}
    </div>
  )
}

export default OrderCard
