import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import './OrderManagement.css'

const OrderManagement = () => {
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API call
        // For now, show no data state
        setOrders([])
      } catch (error) {
        console.error('Error fetching orders:', error)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchOrders()
    }
  }, [isAuthenticated])

  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true
    return order.status === filterStatus
  })

  const handleOrderClick = (order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      // TODO: Replace with actual API call
      console.log('Updating order status:', orderId, newStatus)
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="order-management">
        <div className="auth-message">
          <h2>Please login to manage your orders</h2>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="order-management">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="order-management">
      <div className="page-header">
        <h1>📋 Order Management</h1>
        <p>Manage customer orders and delivery status</p>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Filter by Status:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready for Delivery</option>
            <option value="out-for-delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="orders-container">
        {filteredOrders.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">📦</div>
            <h3>No Orders Found</h3>
            <p>There are no orders to display. Start receiving orders from customers to see them here.</p>
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map(order => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <h3>{order.orderNumber}</h3>
                  <span className={`status ${order.status}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <div className="order-customer">
                  <p><strong>Customer:</strong> {order.customer?.name || 'N/A'}</p>
                  <p><strong>Phone:</strong> {order.customer?.phone || 'N/A'}</p>
                </div>
                <div className="order-items">
                  <p><strong>Items:</strong> {order.items?.length || 0}</p>
                  <p><strong>Total:</strong> ₹{order.totalAmount || 0}</p>
                </div>
                <div className="order-actions">
                  <button 
                    onClick={() => handleOrderClick(order)}
                    className="btn btn-outline"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details - {selectedOrder.orderNumber}</h2>
              <button 
                className="close-btn"
                onClick={() => setShowOrderModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="order-info">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> {selectedOrder.customer?.name || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedOrder.customer?.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {selectedOrder.customer?.phone || 'N/A'}</p>
                <p><strong>Address:</strong> {selectedOrder.deliveryAddress?.street || 'N/A'}</p>
              </div>
              <div className="order-items-list">
                <h3>Order Items</h3>
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} className="order-item">
                    <p><strong>{item.productName}</strong></p>
                    <p>Quantity: {item.quantity} {item.unit}</p>
                    <p>Price: ₹{item.pricePerUnit}/{item.unit}</p>
                    <p>Total: ₹{item.totalPrice}</p>
                  </div>
                ))}
              </div>
              <div className="order-summary">
                <h3>Order Summary</h3>
                <p><strong>Total Amount:</strong> ₹{selectedOrder.totalAmount || 0}</p>
                <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod || 'N/A'}</p>
                <p><strong>Order Date:</strong> {new Date(selectedOrder.orderDate).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowOrderModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderManagement
