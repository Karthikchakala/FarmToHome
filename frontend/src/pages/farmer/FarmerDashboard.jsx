import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // TODO: Replace with actual API calls
        // For now, show no data state
        const emptyData = {
          totalProducts: 0,
          activeOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
          totalRevenue: 0,
          monthlyRevenue: 0,
          totalCustomers: 0,
          lowStockItems: 0
        }
        
        setDashboardData(emptyData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setDashboardData({
          totalProducts: 0,
          activeOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
          totalRevenue: 0,
          monthlyRevenue: 0,
          totalCustomers: 0,
          lowStockItems: 0
        })
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

          {/* Recent Orders */}
          <div className="recent-orders-section">
            <h2>📋 Recent Orders</h2>
            <div className="orders-table-container">
              {dashboardData.activeOrders === 0 ? (
                <div className="no-data">
                  <div className="no-data-icon">📋</div>
                  <h3>No Recent Orders</h3>
                  <p>There are no recent orders to display. Start receiving orders from customers to see them here.</p>
                </div>
              ) : (
                <>
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* TODO: Replace with actual recent orders data */}
                      <tr>
                        <td colSpan="5" className="no-data-row">
                          No recent orders available
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <Link to="/farmer/orders" className="view-all-link">
                    View All Orders →
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Alerts Section */}
          <div className="alerts-section">
            <h2>⚠️ Alerts & Notifications</h2>
            <div className="alerts-container">
              {dashboardData.lowStockItems > 0 && (
                <div className="alert alert-warning">
                  <div className="alert-icon">⚠️</div>
                  <div className="alert-content">
                    <h4>Low Stock Alert</h4>
                    <p>{dashboardData.lowStockItems} products are running low on stock</p>
                    <Link to="/farmer/stock" className="alert-action">
                      Manage Stock Now
                    </Link>
                  </div>
                </div>
              )}
              
              {dashboardData.lowStockItems === 0 && dashboardData.activeOrders === 0 ? (
                <div className="alert alert-info">
                  <div className="alert-icon">ℹ️</div>
                  <div className="alert-content">
                    <h4>Welcome to Your Dashboard</h4>
                    <p>Start by adding products and receiving orders from customers</p>
                    <Link to="/farmer/products" className="alert-action">
                      Add Your First Product
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FarmerDashboard
