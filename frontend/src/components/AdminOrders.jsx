import { useState, useEffect } from 'react'
import { adminAPI } from '../services/adminAPI'
import LoadingSpinner from './LoadingSpinner'
import './AdminOrders.css'

const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 20
  })
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [filters, pagination.currentPage])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError('')
      
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        ...filters
      }
      
      const response = await adminAPI.getAllOrders(params)
      
      if (response.data.success) {
        setOrders(response.data.data.orders || [])
        setPagination(response.data.data.pagination)
      } else {
        setError(response.data.error || 'Failed to fetch orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }))
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      PLACED: { color: '#ffc107', label: 'Placed' },
      CONFIRMED: { color: '#17a2b8', label: 'Confirmed' },
      PACKED: { color: '#6f42c1', label: 'Packed' },
      OUT_FOR_DELIVERY: { color: '#fd7e14', label: 'Out for Delivery' },
      DELIVERED: { color: '#28a745', label: 'Delivered' },
      COMPLETED: { color: '#20c997', label: 'Completed' },
      CANCELLED: { color: '#dc3545', label: 'Cancelled' },
      FAILED: { color: '#6c757d', label: 'Failed' },
      DISPUTED: { color: '#e83e8c', label: 'Disputed' }
    }
    
    const config = statusConfig[status] || statusConfig.PLACED
    return (
      <span 
        className="status-badge" 
        style={{ backgroundColor: config.color }}
      >
        {config.label}
      </span>
    )
  }

  const getPaymentStatusBadge = (paymentStatus) => {
    const paymentConfig = {
      PENDING: { color: '#ffc107', label: 'Pending' },
      PAID: { color: '#28a745', label: 'Paid' },
      FAILED: { color: '#dc3545', label: 'Failed' },
      REFUNDED: { color: '#6f42c1', label: 'Refunded' }
    }
    
    const config = paymentConfig[paymentStatus] || paymentConfig.PENDING
    return (
      <span 
        className="payment-status-badge" 
        style={{ backgroundColor: config.color }}
      >
        {config.label}
      </span>
    )
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

  const copyOrderId = (orderId) => {
    navigator.clipboard.writeText(orderId).then(() => {
      // You could add a toast notification here
      console.log('Order ID copied:', orderId)
    }).catch(err => {
      console.error('Failed to copy order ID:', err)
    })
  }

  if (loading) {
    return (
      <div className="admin-orders-loading">
        <LoadingSpinner size="large" text="Loading orders..." />
      </div>
    )
  }

  return (
    <div className="admin-orders">
      <div className="orders-header">
        <h2>All Orders</h2>
        <p>Manage and view all customer orders</p>
      </div>

      {/* Filters */}
      <div className="orders-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">All Status</option>
            <option value="PLACED">Placed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PACKED">Packed</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="FAILED">Failed</option>
            <option value="DISPUTED">Disputed</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Start Date:</label>
          <input 
            type="date" 
            name="startDate" 
            value={filters.startDate} 
            onChange={handleFilterChange}
          />
        </div>

        <div className="filter-group">
          <label>End Date:</label>
          <input 
            type="date" 
            name="endDate" 
            value={filters.endDate} 
            onChange={handleFilterChange}
          />
        </div>

        <button className="btn btn-secondary" onClick={() => {
          setFilters({ status: '', startDate: '', endDate: '' })
          setPagination(prev => ({ ...prev, currentPage: 1 }))
        }}>
          Clear Filters
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="orders-table-container">
        {orders.length > 0 ? (
          <div className="orders-table">
            <div className="table-header">
              <div>Order ID</div>
              <div>Customer</div>
              <div>Date</div>
              <div>Order Status</div>
              <div>Payment Status</div>
              <div>Total</div>
              <div>Items</div>
              <div>Actions</div>
            </div>
            
            {orders.map(order => (
              <div key={order._id} className="table-row">
                <div className="order-id-cell">
                  <span 
                    className="order-id" 
                    onClick={() => copyOrderId(order._id)}
                    title="Click to copy ID"
                  >
                    #{order.ordernumber}
                  </span>
                </div>
                
                <div className="customer-cell">
                  <div className="customer-name">{order.users?.name}</div>
                  <div className="customer-email">{order.users?.email}</div>
                </div>
                
                <div className="date-cell">
                  {formatDate(order.createdat)}
                </div>
                
                <div className="status-cell">
                  {getStatusBadge(order.status)}
                </div>
                
                <div className="payment-status-cell">
                  {getPaymentStatusBadge(order.paymentstatus)}
                </div>
                
                <div className="total-cell">
                  Rs. {order.totalamount?.toFixed(2)}
                </div>
                
                <div className="items-cell">
                  {order.items?.length || 0} items
                </div>
                
                <div className="actions-cell">
                  <button 
                    className="btn btn-small btn-primary"
                    onClick={() => setSelectedOrder(order)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-orders">
            <div className="no-orders-icon">📦</div>
            <h3>No orders found</h3>
            <p>Try adjusting your filters or check back later.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button 
            className="btn btn-secondary"
            disabled={pagination.currentPage === 1}
            onClick={() => handlePageChange(pagination.currentPage - 1)}
          >
            Previous
          </button>
          
          <span className="page-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button 
            className="btn btn-secondary"
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => handlePageChange(pagination.currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details - #{selectedOrder.ordernumber}</h3>
              <button onClick={() => setSelectedOrder(null)} className="close-btn">✕</button>
            </div>
            
            <div className="modal-content">
              <div className="order-details">
                <div className="detail-section">
                  <h4>Order Information</h4>
                  <div className="detail-row">
                    <span>Order ID:</span>
                    <span>{selectedOrder._id}</span>
                  </div>
                  <div className="detail-row">
                    <span>Date:</span>
                    <span>{formatDate(selectedOrder.createdat)}</span>
                  </div>
                  <div className="detail-row">
                    <span>Status:</span>
                    <span>{getStatusBadge(selectedOrder.status)}</span>
                  </div>
                  <div className="detail-row">
                    <span>Payment Status:</span>
                    <span>{getPaymentStatusBadge(selectedOrder.paymentstatus)}</span>
                  </div>
                  <div className="detail-row">
                    <span>Total Amount:</span>
                    <span>Rs. {selectedOrder.totalamount?.toFixed(2)}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Delivery Address</h4>
                  <div className="address">
                    {selectedOrder.consumers?.defaultaddressstreet},<br />
                    {selectedOrder.consumers?.defaultaddresscity}, {selectedOrder.consumers?.defaultaddressstate}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Order Items</h4>
                  <div className="items-list">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="item-row">
                        <div className="item-info">
                          <div className="item-name">{item.products?.name}</div>
                          <div className="item-details">
                            Rs. {item.products?.price || item.price || 0} × {item.quantity || 0} = Rs. {((item.products?.price || item.price || 0) * (item.quantity || 0)).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrders
