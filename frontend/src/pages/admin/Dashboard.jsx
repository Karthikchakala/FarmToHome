import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { adminAPI } from '../../services/adminAPI'
import StatCard from '../../components/StatCard'
import LoadingSpinner from '../../components/LoadingSpinner'
import './Dashboard.css'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await adminAPI.getDashboardStats()
        if (response.data.success) {
          setStats(response.data.data || {
            totalUsers: 0,
            activeUsers: 0,
            totalOrders: 0,
            totalRevenue: 0,
            totalProducts: 0,
            pendingApprovals: 0,
            systemHealth: 'Good'
          })
        } else {
          console.error('Failed to fetch stats:', response.data.message)
          setStats({
            totalUsers: 0,
            activeUsers: 0,
            totalOrders: 0,
            totalRevenue: 0,
            totalProducts: 0,
            pendingApprovals: 0,
            systemHealth: 'Good'
          })
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
        setError('Failed to load dashboard data')
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          totalOrders: 0,
          totalRevenue: 0,
          totalProducts: 0,
          pendingApprovals: 0,
          systemHealth: 'Good'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="dashboard admin-dashboard">
        <LoadingSpinner size="large" text="Loading admin dashboard..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard admin-dashboard">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Unable to load dashboard</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            🔄 Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>System administration and analytics</p>
      </div>

        {/* Admin Stats Grid */}
        <div className="admin-stats-grid">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            subtitle="Registered users"
            icon="👥"
            color="primary"
          />
          
          <StatCard
            title="Active Users"
            value={stats?.activeUsers || 0}
            subtitle="Currently active"
            icon="🟢"
            color="success"
          />
          
          <StatCard
            title="Total Orders"
            value={stats?.totalOrders || 0}
            subtitle="All time orders"
            icon="📦"
            color="info"
          />
          
          <StatCard
            title="Total Revenue"
            value={`₹${stats?.totalRevenue?.toLocaleString() || '0'}`}
            subtitle="Lifetime revenue"
            icon="💰"
            color="success"
          />
          
          <StatCard
            title="Total Products"
            value={stats?.totalProducts || 0}
            subtitle="In marketplace"
            icon="🥬"
            color="warning"
          />
          
          <StatCard
            title="Pending Approvals"
            value={stats?.pendingApprovals || 0}
            subtitle="Farmer verification"
            icon="⏳"
            color="warning"
          />
        </div>

        {/* System Health */}
        <div className="system-health">
          <h2>System Health</h2>
          <div className="health-status">
            <div className={`status-indicator ${stats?.systemHealth === 'Good' ? 'good' : 'poor'}`}>
              {stats?.systemHealth === 'Good' ? '✅' : '⚠️'}
            </div>
            <span className="health-text">System Status: {stats?.systemHealth || 'Unknown'}</span>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="admin-actions">
          <h2>Admin Actions</h2>
          <div className="actions-grid">
            <Link to="/admin/users" className="action-card">
              <div className="action-icon">👥</div>
              <div className="action-content">
                <h3>User Management</h3>
                <p>Manage all users and permissions</p>
              </div>
            </Link>
            
            <Link to="/admin/orders" className="action-card">
              <div className="action-icon">📦</div>
              <div className="action-content">
                <h3>Order Management</h3>
                <p>View and manage all orders</p>
              </div>
            </Link>
            
            <Link to="/admin/products" className="action-card">
              <div className="action-icon">🥬</div>
              <div className="action-content">
                <h3>Product Management</h3>
                <p>Manage all products and listings</p>
              </div>
            </Link>
            
            <Link to="/admin/farmers" className="action-card">
              <div className="action-icon">👨‍🌾</div>
              <div className="action-content">
                <h3>Farmer Management</h3>
                <p>Approve farmers and manage their profiles</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    )
}

export default AdminDashboard
