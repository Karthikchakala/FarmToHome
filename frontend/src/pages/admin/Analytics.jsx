import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { adminAPI } from '../../services/adminAPI'
import LoadingSpinner from '../../components/LoadingSpinner'
import './Analytics.css'

const AdminAnalytics = () => {
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalFarmers: 0,
    totalProducts: 0,
    averageOrderValue: 0,
    monthlyGrowth: 0,
    revenue: {
      total: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      thisQuarter: 0,
      thisYear: 0
    },
    orders: {
      total: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      thisQuarter: 0,
      thisYear: 0,
      pending: 0,
      completed: 0,
      cancelled: 0
    },
    users: {
      total: 0,
      farmers: 0,
      consumers: 0,
      admins: 0,
      verified: 0,
      newThisMonth: 0
    },
    products: {
      total: 0,
      available: 0,
      outOfStock: 0,
      featured: 0,
      newThisMonth: 0
    },
    farmers: {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      newThisMonth: 0
    }
  })

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await adminAPI.getAnalytics()
        if (response.data.success) {
          const data = response.data.data
          setAnalytics({
            totalRevenue: data.revenue.total,
            totalOrders: data.orders.total,
            totalUsers: data.users.total,
            totalFarmers: data.farmers.total,
            totalProducts: data.products.total,
            averageOrderValue: data.orders.total > 0 ? data.revenue.total / data.orders.total : 0,
            monthlyGrowth: 0, // TODO: Calculate based on previous month
            revenue: data.revenue,
            orders: data.orders,
            users: data.users,
            products: data.products,
            farmers: data.farmers
          })
        } else {
          console.error('Failed to fetch analytics:', response.data.message)
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchAnalytics()
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="admin-analytics">
        <div className="auth-message">
          <h2>Please login to access admin panel</h2>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="admin-analytics">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="admin-analytics">
      <div className="page-header">
        <h1>📈 Analytics</h1>
        <p>Platform-wide analytics and business insights</p>
      </div>

      <div className="analytics-container">
        {/* Main Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>₹{analytics.totalRevenue.toLocaleString()}</h3>
              <p>Total Revenue</p>
              <div className="stat-details">
                <small>Today: ₹{analytics.revenue.today.toLocaleString()}</small>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">�</div>
            <div className="stat-content">
              <h3>{analytics.totalOrders.toLocaleString()}</h3>
              <p>Total Orders</p>
              <div className="stat-details">
                <small>Pending: {analytics.orders.pending} | Completed: {analytics.orders.completed}</small>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{analytics.totalUsers.toLocaleString()}</h3>
              <p>Total Users</p>
              <div className="stat-details">
                <small>Farmers: {analytics.users.farmers} | Consumers: {analytics.users.consumers}</small>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🌾</div>
            <div className="stat-content">
              <h3>{analytics.totalFarmers.toLocaleString()}</h3>
              <p>Total Farmers</p>
              <div className="stat-details">
                <small>Approved: {analytics.farmers.approved} | Pending: {analytics.farmers.pending}</small>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🥬</div>
            <div className="stat-content">
              <h3>{analytics.totalProducts.toLocaleString()}</h3>
              <p>Total Products</p>
              <div className="stat-details">
                <small>Available: {analytics.products.available} | Featured: {analytics.products.featured}</small>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">💵</div>
            <div className="stat-content">
              <h3>₹{analytics.averageOrderValue.toFixed(2)}</h3>
              <p>Average Order Value</p>
              <div className="stat-details">
                <small>Per order average</small>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Analytics Sections */}
        <div className="analytics-sections">
          {/* Revenue Analytics */}
          <div className="analytics-section">
            <h2>💰 Revenue Analytics</h2>
            <div className="section-grid">
              <div className="metric-card">
                <h4>Today</h4>
                <p>₹{analytics.revenue.today.toLocaleString()}</p>
              </div>
              <div className="metric-card">
                <h4>This Week</h4>
                <p>₹{analytics.revenue.thisWeek.toLocaleString()}</p>
              </div>
              <div className="metric-card">
                <h4>This Month</h4>
                <p>₹{analytics.revenue.thisMonth.toLocaleString()}</p>
              </div>
              <div className="metric-card">
                <h4>This Quarter</h4>
                <p>₹{analytics.revenue.thisQuarter.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Order Analytics */}
          <div className="analytics-section">
            <h2>📦 Order Analytics</h2>
            <div className="section-grid">
              <div className="metric-card">
                <h4>Total Orders</h4>
                <p>{analytics.orders.total.toLocaleString()}</p>
              </div>
              <div className="metric-card">
                <h4>Pending</h4>
                <p>{analytics.orders.pending}</p>
              </div>
              <div className="metric-card">
                <h4>Completed</h4>
                <p>{analytics.orders.completed}</p>
              </div>
              <div className="metric-card">
                <h4>Cancelled</h4>
                <p>{analytics.orders.cancelled}</p>
              </div>
            </div>
          </div>

          {/* User Analytics */}
          <div className="analytics-section">
            <h2>👥 User Analytics</h2>
            <div className="section-grid">
              <div className="metric-card">
                <h4>Total Users</h4>
                <p>{analytics.users.total.toLocaleString()}</p>
              </div>
              <div className="metric-card">
                <h4>Farmers</h4>
                <p>{analytics.users.farmers}</p>
              </div>
              <div className="metric-card">
                <h4>Consumers</h4>
                <p>{analytics.users.consumers}</p>
              </div>
              <div className="metric-card">
                <h4>Verified</h4>
                <p>{analytics.users.verified}</p>
              </div>
            </div>
          </div>

          {/* Farmer Analytics */}
          <div className="analytics-section">
            <h2>🌾 Farmer Analytics</h2>
            <div className="section-grid">
              <div className="metric-card">
                <h4>Total Farmers</h4>
                <p>{analytics.farmers.total}</p>
              </div>
              <div className="metric-card">
                <h4>Approved</h4>
                <p>{analytics.farmers.approved}</p>
              </div>
              <div className="metric-card">
                <h4>Pending</h4>
                <p>{analytics.farmers.pending}</p>
              </div>
              <div className="metric-card">
                <h4>New This Month</h4>
                <p>{analytics.farmers.newThisMonth}</p>
              </div>
            </div>
          </div>

          {/* Product Analytics */}
          <div className="analytics-section">
            <h2>🥬 Product Analytics</h2>
            <div className="section-grid">
              <div className="metric-card">
                <h4>Total Products</h4>
                <p>{analytics.products.total}</p>
              </div>
              <div className="metric-card">
                <h4>Available</h4>
                <p>{analytics.products.available}</p>
              </div>
              <div className="metric-card">
                <h4>Out of Stock</h4>
                <p>{analytics.products.outOfStock}</p>
              </div>
              <div className="metric-card">
                <h4>Featured</h4>
                <p>{analytics.products.featured}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminAnalytics
