import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { notificationAPI } from '../../services/notificationAPI'
import LoadingSpinner from '../../components/LoadingSpinner'
import './FarmerDashboard.css'

const FarmerDashboard = () => {
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    activeOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalCustomers: 0,
    lowStockItems: 0
  })
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch real data from APIs
        const [notificationsResponse] = await Promise.all([
          notificationAPI.getNotifications({ limit: 5 })
        ])
        
        // Set notifications data
        if (notificationsResponse.data.success) {
          const notificationsData = notificationsResponse.data.data.notifications || []
          console.log('FarmerDashboard - Notifications data received:', notificationsData)
          console.log('FarmerDashboard - Sample notification:', notificationsData[0])
          setNotifications(notificationsData)
        }
        
        // TODO: Add farmer dashboard data API call when available
        // For now, keep dashboard data as is (will be updated when API is ready)
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchDashboardData()
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="dashboard-container">
        <div className="auth-message">
          <h2>Please login to access your farmer dashboard</h2>
          <Link to="/login" className="btn btn-primary">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return <LoadingSpinner size="large" text="Loading dashboard..." />
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) {
      console.log('FarmerDashboard - Date string is null or undefined:', dateString)
      return 'Unknown'
    }
    
    try {
      const date = new Date(dateString)
      const now = new Date()
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log('FarmerDashboard - Invalid date created:', dateString, '->', date)
        return 'Invalid Date'
      }
      
      const diffTime = Math.abs(now - date)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) {
        return 'Today'
      } else if (diffDays === 1) {
        return 'Yesterday'
      } else if (diffDays < 7) {
        return `${diffDays} days ago`
      } else {
        return date.toLocaleDateString()
      }
    } catch (error) {
      console.error('FarmerDashboard - Error formatting date:', error, 'Input:', dateString)
      return 'Invalid Date'
    }
  }

  return (
    <div className="farmer-dashboard">
      <div className="dashboard-header">
        <h1>🌾 Farmer Dashboard</h1>
        <p className="welcome-message">
          Welcome back, {user?.name || 'Farmer'}! 👋
        </p>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-grid">
          {/* Overview Cards */}
          <div className="overview-section">
            <h2>📊 Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🌾</div>
                <div className="stat-content">
                  <h3>{dashboardData.totalProducts}</h3>
                  <p>Total Products</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <h3>{dashboardData.activeOrders}</h3>
                  <p>Active Orders</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <h3>{formatCurrency(dashboardData.totalRevenue)}</h3>
                  <p>Total Revenue</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h3>{dashboardData.totalCustomers}</h3>
                  <p>Total Customers</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-section">
            <h2>⚡ Quick Actions</h2>
            <div className="actions-grid">
              <Link to="/farmer/products/new" className="action-card">
                <div className="action-icon">➕</div>
                <h3>Add Product</h3>
                <p>List new products for sale</p>
              </Link>
              
              <Link to="/farmer/orders" className="action-card">
                <div className="action-icon">📋</div>
                <h3>View Orders</h3>
                <p>Manage customer orders</p>
              </Link>
              
              <Link to="/farmer/stock" className="action-card">
                <div className="action-icon">📦</div>
                <h3>Manage Stock</h3>
                <p>Update inventory levels</p>
              </Link>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="reviews-section">
            <h2>⭐ Recent Reviews</h2>
            <div className="reviews-container">
              <div className="no-data">
                <div className="no-data-icon">⭐</div>
                <h3>No Reviews Yet</h3>
                <p>Customer reviews will appear here once customers start reviewing your products.</p>
                <Link to="/farmer/products" className="view-all-link">
                  Manage Products →
                </Link>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="notifications-section">
            <h2>� Notifications</h2>
            <div className="notifications-container">
              {notifications.length > 0 ? (
                <>
                  <div className="notifications-list">
                    {notifications.map(notification => (
                      <div key={notification._id} className={`notification-item ${notification.isread ? 'read' : 'unread'}`}>
                        <div className="notification-icon">
                          {notification.type === 'new_order' ? '📋' : 
                           notification.type === 'order_cancelled' ? '❌' :
                           notification.type === 'chat_message' ? '💬' :
                           notification.type === 'alert' ? '⚠️' : 
                           notification.type === 'success' ? '✅' : 'ℹ️'}
                        </div>
                        <div className="notification-content">
                          <h4>{notification.title}</h4>
                          <p>{notification.message}</p>
                          <span className="notification-time">
                            {formatDate(notification.createdat)}
                          </span>
                        </div>
                        {!notification.isread && (
                          <div className="notification-badge"></div>
                        )}
                      </div>
                    ))}
                  </div>
                  <Link to="/farmer/notifications" className="view-all-link">
                    View All Notifications →
                  </Link>
                </>
              ) : (
                <div className="no-data">
                  <div className="no-data-icon">🔔</div>
                  <h3>No Notifications</h3>
                  <p>You have no new notifications at the moment.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FarmerDashboard
