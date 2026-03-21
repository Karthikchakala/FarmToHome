import { useState, useEffect } from 'react'
import { orderAPI } from '../../services/api'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './FarmerOrders.css'

const FarmerOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updatingOrderId, setUpdatingOrderId] = useState(null)

  const statusOptions = [
    { value: 'PLACED', label: '📋 Placed', color: '#FFA500' },
    { value: 'CONFIRMED', label: '✅ Confirmed', color: '#4CAF50' },
    { value: 'PREPARING', label: '👨‍🍳 Preparing', color: '#2196F3' },
    { value: 'OUT_FOR_DELIVERY', label: '🚚 Out for Delivery', color: '#9C27B0' },
    { value: 'DELIVERED', label: '🎉 Delivered', color: '#8BC34A' },
    { value: 'CANCELLED', label: '❌ Cancelled', color: '#F44336' }
  ]

  useEffect(() => {
    fetchOrders()
  }, [filter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = filter !== 'all' ? { status: filter } : {}
      const response = await orderAPI.getFarmerOrders(params)
      if (response.data.success) {
        setOrders(response.data.data.orders)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId)
      const response = await orderAPI.updateOrderStatus(orderId, { status: newStatus })
      if (response.data.success) {
        toast.success('Order status updated successfully')
        fetchOrders() // Refresh orders
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
      toast.error('Failed to update order status')
    } finally {
      setUpdatingOrderId(null)
    }
  }

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

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'PLACED': 'CONFIRMED',
      'CONFIRMED': 'PREPARING',
      'PREPARING': 'OUT_FOR_DELIVERY',
      'OUT_FOR_DELIVERY': 'DELIVERED',
      'DELIVERED': null,
      'CANCELLED': null
    }
    return statusFlow[currentStatus]
  }

  const canUpdate = (status) => {
    return ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(status)
  }

  if (loading) {
    return (
      <div className="farmer-orders-container">
        <div className="loading">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="farmer-orders-container">
      <div className="orders-header">
        <h1>📦 My Orders</h1>
        <div className="filter-section">
          <label htmlFor="status-filter">Filter by Status:</label>
          <select 
            id="status-filter"
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Orders</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>No orders found</p>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order.ordernumber}</h3>
                  <p className="order-date">{formatDate(order.createdat)}</p>
                </div>
                <div 
                  className="status-badge"
                  style={{ backgroundColor: statusOptions.find(s => s.value === order.status)?.color }}
                >
                  {statusOptions.find(s => s.value === order.status)?.label}
                </div>
              </div>

              <div className="order-content">
                <div className="order-items">
                  <h4>Items ({order.items?.length || 0})</h4>
                  {order.items?.map((item, index) => (
                    <div key={index} className="order-item">
                      <span className="item-name">{item.productName}</span>
                      <span className="item-quantity">×{item.quantity}</span>
                      <span className="item-price">{formatPrice(item.pricePerUnit)}</span>
                    </div>
                  ))}
                </div>

                <div className="order-details">
                  <div className="detail-row">
                    <span>Total Amount:</span>
                    <span className="amount">{formatPrice(order.finalamount)}</span>
                  </div>
                  <div className="detail-row">
                    <span>Payment:</span>
                    <span>{order.paymentmethod === 'COD' ? 'Cash on Delivery' : order.paymentmethod}</span>
                  </div>
                  <div className="detail-row">
                    <span>Delivery:</span>
                    <span>{order.deliverycharge === 0 ? 'FREE' : formatPrice(order.deliverycharge)}</span>
                  </div>
                  <div className="detail-row address">
                    <span>Delivery Address:</span>
                    <span>
                      {order.deliveryaddress?.street}, {order.deliveryaddress?.city}, 
                      {order.deliveryaddress?.state} - {order.deliveryaddress?.postalCode}
                    </span>
                  </div>
                </div>
              </div>

              {canUpdate(order.status) && (
                <div className="order-actions">
                  <button
                    className="update-status-btn"
                    onClick={() => updateOrderStatus(order._id, getNextStatus(order.status))}
                    disabled={updatingOrderId === order._id}
                  >
                    {updatingOrderId === order._id ? 'Updating...' : 
                     `Mark as ${getNextStatus(order.status)?.replace('_', ' ')}`}
                  </button>
                </div>
              )}

              {/* Order Status Timeline */}
              <div className="order-timeline">
                <h4>Order Timeline</h4>
                <div className="timeline">
                  {statusOptions.slice(0, -1).map((status, index) => {
                    const isCompleted = statusOptions.findIndex(s => s.value === order.status) >= index
                    const isCurrent = status.value === order.status
                    return (
                      <div key={status.value} className={`timeline-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <span className="timeline-label">{status.label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FarmerOrders
