import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import './OrderManagement.css'

const AdminOrderManagement = () => {
  const { user, isAuthenticated } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')

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

  if (!isAuthenticated) {
    return (
      <div className="admin-order-management">
        <div className="auth-message">
          <h2>Please login to access admin panel</h2>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="admin-order-management">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="admin-order-management">
      <div className="page-header">
        <h1>📦 Order Management</h1>
        <p>View and manage all orders across the platform</p>
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
            <p>There are no orders to display. Orders will appear here once customers start making purchases.</p>
          </div>
        ) : (
          <div className="orders-table">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Farmer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order._id}>
                    <td>{order.orderNumber || 'N/A'}</td>
                    <td>{order.customer?.name || 'N/A'}</td>
                    <td>{order.farmer?.name || 'N/A'}</td>
                    <td>₹{order.totalAmount || 0}</td>
                    <td>
                      <span className={`status ${order.status}`}>
                        {order.status || 'Unknown'}
                      </span>
                    </td>
                    <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <button className="btn btn-outline">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminOrderManagement
