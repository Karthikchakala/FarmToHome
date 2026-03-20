import { Link } from 'react-router-dom'
import { orderAPI } from '../services/api'
import { useState } from 'react'
import './OrderCard.css'

const OrderCard = ({ order, onUpdate }) => {
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')

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
      case 'PREPARING': return '#6f42c1'
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
      case 'PREPARING': return '👨‍🍳'
      case 'OUT_FOR_DELIVERY': return '🚚'
      case 'DELIVERED': return '✅'
      case 'CANCELLED': return '❌'
      default: return '📦'
    }
  }

  const handleCancelOrder = async () => {
    const reason = prompt('Please provide a reason for cancellation:')
    if (!reason) return

    try {
      setCancelling(true)
      setError('')

      const response = await orderAPI.cancelOrder(order._id, reason)

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

  const canCancel = ['PLACED', 'CONFIRMED'].includes(order.status)

  return (
    <div className="order-card">
      <div className="order-header">
        <div className="order-info">
          <div className="order-number">
            <span className="order-id">#{order.ordernumber}</span>
            <span className="order-date">{formatDate(order.createdat)}</span>
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

      <div className="order-content">
        <div className="order-items-preview">
          <div className="items-header">
            <span className="items-count">{order.items?.length || 0} items</span>
            <span className="total-amount">{formatPrice(order.totalamount)}</span>
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
            <span className="detail-label">Payment:</span>
            <span className="detail-value">
              {order.paymentmethod === 'COD' ? 'Cash on Delivery' : order.paymentmethod}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Delivery:</span>
            <span className="detail-value">
              {order.deliverycharge === 0 ? 'FREE' : formatPrice(order.deliverycharge)}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Platform Fee:</span>
            <span className="detail-value">{formatPrice(order.platformcommission)}</span>
          </div>
        </div>
      </div>

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
