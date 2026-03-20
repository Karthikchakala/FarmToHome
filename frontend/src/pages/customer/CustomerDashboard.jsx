import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { customerAPI } from '../../services/customerAPI'
import LoadingSpinner from '../../components/LoadingSpinner'
import './CustomerDashboard.css'

const CustomerDashboard = () => {
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalSpent: 0,
    monthlySpent: 0,
    savedAmount: 0,
    activeSubscriptions: 0,
    favoriteProducts: 0,
    recentOrders: [],
    favoriteFarmers: []
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // TODO: Replace with actual API call
        const response = await customerAPI.getDashboardData()
        if (response.data.success) {
          setDashboardData(response.data.data || {
            totalOrders: 0,
            activeOrders: 0,
            completedOrders: 0,
            pendingOrders: 0,
            totalSpent: 0,
            monthlySpent: 0,
            savedAmount: 0,
            activeSubscriptions: 0,
            favoriteProducts: 0,
            recentOrders: [],
            favoriteFarmers: []
          })
        } else {
          console.error('Failed to fetch dashboard data:', response.data.message)
          setDashboardData({
            totalOrders: 0,
            activeOrders: 0,
            completedOrders: 0,
            pendingOrders: 0,
            totalSpent: 0,
            monthlySpent: 0,
            savedAmount: 0,
            activeSubscriptions: 0,
            favoriteProducts: 0,
            recentOrders: [],
            favoriteFarmers: []
          })
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setDashboardData({
          totalOrders: 0,
          activeOrders: 0,
          completedOrders: 0,
          pendingOrders: 0,
          totalSpent: 0,
          monthlySpent: 0,
          savedAmount: 0,
          activeSubscriptions: 0,
          favoriteProducts: 0,
          recentOrders: [],
          favoriteFarmers: []
        })
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchDashboardData()
    }
  }, [isAuthenticated])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (!isAuthenticated) {
    return (
      <div className="customer-dashboard">
        <div className="auth-message">
          <h2>Please login to access your dashboard</h2>
          <Link to="/login" className="btn btn-primary">Login</Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="customer-dashboard">
        <LoadingSpinner size="large" text="Loading your dashboard..." />
      </div>
    )
  }

  return (
    <div className="customer-dashboard">
      <div className="page-header">
        <h1>🏠 Welcome back, {user?.name || 'Customer'}!</h1>
        <p>Here's what's happening with your orders and subscriptions</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{dashboardData.totalOrders}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{dashboardData.activeOrders}</h3>
            <p>Active Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>{formatCurrency(dashboardData.totalSpent)}</h3>
            <p>Total Spent</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💎</div>
          <div className="stat-content">
            <h3>{formatCurrency(dashboardData.savedAmount)}</h3>
            <p>Total Saved</p>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <h3>{dashboardData.activeSubscriptions}</h3>
            <p>Active Subscriptions</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❤️</div>
          <div className="stat-content">
            <h3>{dashboardData.favoriteProducts}</h3>
            <p>Favorite Products</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👨‍🌾</div>
          <div className="stat-content">
            <h3>{dashboardData.favoriteFarmers.length}</h3>
            <p>Favorite Farmers</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{formatCurrency(dashboardData.monthlySpent)}</h3>
            <p>This Month</p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="recent-orders-section">
        <h2>📦 Recent Orders</h2>
        <div className="orders-table-container">
          {dashboardData.recentOrders.length === 0 ? (
            <div className="no-data">
              <div className="no-data-icon">📦</div>
              <h3>No Recent Orders</h3>
              <p>You haven't placed any orders yet. Start shopping to see your orders here!</p>
              <Link to="/products" className="btn btn-primary">
                Start Shopping
              </Link>
            </div>
          ) : (
            <>
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.items} items</td>
                      <td>{formatCurrency(order.amount)}</td>
                      <td><span className={`status ${order.status.toLowerCase()}`}>{order.status}</span></td>
                      <td>{order.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Link to="/customer/orders" className="view-all-link">
                View All Orders →
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>⚡ Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/products" className="action-card">
            <div className="action-icon">🛒</div>
            <h3>Shop Products</h3>
            <p>Browse fresh produce from local farmers</p>
          </Link>
          <Link to="/customer/subscriptions" className="action-card">
            <div className="action-icon">🔄</div>
            <h3>Manage Subscriptions</h3>
            <p>Set up recurring deliveries</p>
          </Link>
          <Link to="/cart" className="action-card">
            <div className="action-icon">🛍️</div>
            <h3>View Cart</h3>
            <p>Complete your pending orders</p>
          </Link>
          <Link to="/customer/reviews" className="action-card">
            <div className="action-icon">⭐</div>
            <h3>Write Reviews</h3>
            <p>Share your experience with products</p>
          </Link>
        </div>
      </div>

      {/* Favorite Farmers */}
      <div className="favorite-farmers-section">
        <h2>👨‍🌾 Your Favorite Farmers</h2>
        <div className="farmers-grid">
          {dashboardData.favoriteFarmers.length === 0 ? (
            <div className="no-data">
              <div className="no-data-icon">👨‍🌾</div>
              <h3>No Favorite Farmers Yet</h3>
              <p>Start ordering from farmers to see them here!</p>
            </div>
          ) : (
            dashboardData.favoriteFarmers.map((farmer) => (
              <div key={farmer.id} className="farmer-card">
                <div className="farmer-info">
                  <h4>{farmer.name}</h4>
                  <p>{farmer.farmName}</p>
                  <div className="farmer-rating">
                    ⭐ {farmer.rating} ({farmer.reviews} reviews)
                  </div>
                </div>
                <Link to={`/products?farmer=${farmer.id}`} className="btn btn-outline">
                  View Products
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomerDashboard
