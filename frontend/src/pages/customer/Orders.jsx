import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import OrderCard from "../../components/OrderCard"
import { orderAPI } from "../../services/api"
import { useAuth } from "../../contexts/AuthContext"
import LoadingSpinner from "../../components/LoadingSpinner"
import "./Orders.css"

const Orders = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [filters, setFilters] = useState({
    status: "",
    page: 1
  })

  // Wait for AuthContext to load, then check authentication
  useEffect(() => {
    if (!authLoading) {
      console.log("Orders - Auth check:", { isAuthenticated, user, authLoading })
      if (!isAuthenticated) {
        console.log("Orders - Redirecting to login")
        navigate("/login")
        return
      }
      setCheckingAuth(false)
    }
  }, [isAuthenticated, navigate, user, authLoading])

  useEffect(() => {
    if (isAuthenticated && !checkingAuth && !authLoading) {
      console.log("Orders - Loading orders")
      fetchOrders()
    }
  }, [filters, isAuthenticated, checkingAuth, authLoading])

  // Show loading while AuthContext is loading or checking auth
  if (authLoading || checkingAuth) {
    return <LoadingSpinner size="large" text="Checking authentication..." />
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch real data from backend
      const params = {
        page: filters.page,
        ...(filters.status && { status: filters.status })
      }
      
      const response = await orderAPI.getOrders(params)
      
      if (response.data.success) {
        setOrders(response.data.data.orders || [])
        setPagination(response.data.data.pagination || null)
      } else {
        console.log('Failed to load orders:', response.data.error)
        setError(response.data.error || 'Failed to load orders')
        setOrders([])
        setPagination(null)
      }
    } catch (err) {
      console.error('Failed to load orders:', err)
      // Don't redirect to login on API errors, just show error message
      if (err.response?.status === 401) {
        setError('Authentication error: ' + (err.response?.data?.error || 'Please login to view your orders'))
        console.log('401 Error details:', err.response?.data)
      } else {
        setError('Failed to connect to server. Please try again later.')
      }
      setOrders([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }

  const handleOrderUpdate = (orderId, newStatus) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order._id === orderId 
          ? { ...order, status: newStatus, status_message: "Order cancelled successfully" }
          : order
      )
    )
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === "status" ? 1 : value
    }))
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const getStatusStats = () => {
    const stats = {
      total: orders.length,
      placed: orders.filter(o => o.status === "PLACED").length,
      confirmed: orders.filter(o => o.status === "CONFIRMED").length,
      preparing: orders.filter(o => o.status === "PREPARING").length,
      delivered: orders.filter(o => o.status === "DELIVERED").length,
      cancelled: orders.filter(o => o.status === "CANCELLED").length
    }
    return stats
  }

  if (loading) {
    return (
      <div className="orders-page">
        <div className="orders-header">
          <h1>My Orders</h1>
        </div>
        <LoadingSpinner size="large" text="Loading orders..." />
      </div>
    )
  }

  const stats = getStatusStats()

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1>My Orders</h1>
        <Link to="/products" className="btn btn-primary">
          Continue Shopping
        </Link>
      </div>

      <div className="order-stats">
        <div className="stat-card">
          <h3>{stats.total}</h3>
          <p>Total Orders</p>
        </div>
        <div className="stat-card">
          <h3>{stats.delivered}</h3>
          <p>Delivered</p>
        </div>
        <div className="stat-card">
          <h3>{stats.confirmed + stats.preparing}</h3>
          <p>In Progress</p>
        </div>
      </div>

      <div className="orders-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filters.status} 
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="filter-select"
          >
            <option value="">All Orders</option>
            <option value="PLACED">Placed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PREPARING">Preparing</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">??</span>
          <span>{error}</span>
        </div>
      )}

      {orders.length === 0 && !error ? (
        <div className="empty-orders">
          <div className="empty-icon">📦</div>
          <h3>No Orders Yet</h3>
          <p>You haven't placed any orders yet. Start shopping to see your orders here!</p>
          <Link to="/products" className="btn btn-primary">
            Make Your First Order
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <OrderCard 
              key={order._id} 
              order={order}
              onUpdate={handleOrderUpdate}
            />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button 
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default Orders
