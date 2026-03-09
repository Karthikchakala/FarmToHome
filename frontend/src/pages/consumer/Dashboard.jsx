import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../../components/StatCard'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import './Dashboard.css'

const ConsumerDashboard = () => {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    // Mock consumer analytics for now
    setTimeout(() => {
      setAnalytics({
        orders: {
          total_orders: 42,
          placed: 5,
          confirmed: 3,
          packed: 2,
          delivered: 32
        },
        spending: {
          total_spent: 12567.89
        },
        subscriptions: {
          active_count: 3,
          active_subscriptions: 3,
          paused_count: 1
        },
        reviews: {
          reviews_given: 15
        },
        recent_orders: [
          {
            order_id: 'ORD-001',
            order_number: 'ORD-001',
            created_at: '2024-01-15',
            amount: 234.50,
            status: 'delivered'
          },
          {
            order_id: 'ORD-002', 
            order_number: 'ORD-002',
            created_at: '2024-01-18',
            amount: 156.75,
            status: 'confirmed'
          }
        ]
      })
      setLoading(false)
    }, 1000)
  }, [])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="dashboard consumer-dashboard">
        <div className="dashboard-content">
          <div className="dashboard-header">
            <h1>Dashboard</h1>
            <p>Loading your dashboard...</p>
          </div>
          
          <div className="stats-grid">
            {[...Array(6)].map((_, i) => (
              <StatCard key={i} loading={true} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard consumer-dashboard">
        <div className="dashboard-content">
          <div className="dashboard-header">
            <h1>Dashboard</h1>
          </div>
          
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h2>Unable to load dashboard</h2>
            <p>{error}</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard consumer-dashboard">
      <div className="dashboard-header">
        <h1>Consumer Dashboard</h1>
        <p>Track your orders, subscriptions, and spending</p>
      </div>

      {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard
            title="Total Orders"
            value={analytics.orders.total_orders}
            subtitle="All time orders"
            icon="📦"
            color="primary"
            trend="up"
            trendValue="+12% this month"
          />
          
          <StatCard
            title="Total Spent"
            value={formatPrice(analytics.spending.total_spent)}
            subtitle="Lifetime spending"
            icon="💰"
            color="success"
            trend="up"
            trendValue="+8% this month"
          />
          
          <StatCard
            title="Active Subscriptions"
            value={analytics.subscriptions.active_count}
            subtitle="Recurring orders"
            icon="🔄"
            color="warning"
            trend="neutral"
            trendValue="No change"
          />
          
          <StatCard
            title="Reviews Given"
            value={analytics.reviews.reviews_given}
            subtitle="Product feedback"
            icon="⭐"
            color="info"
            trend="up"
            trendValue="+3 this month"
          />
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/products" className="action-card">
              <div className="action-icon">🥬</div>
              <div className="action-content">
                <h3>Browse Products</h3>
                <p>Discover fresh produce from local farmers</p>
              </div>
            </Link>
            
            <Link to="/consumer/orders" className="action-card">
              <div className="action-icon">📦</div>
              <div className="action-content">
                <h3>View Orders</h3>
                <p>Track your order status and history</p>
              </div>
            </Link>
            
            <Link to="/consumer/subscriptions" className="action-card">
              <div className="action-icon">🔄</div>
              <div className="action-content">
                <h3>Manage Subscriptions</h3>
                <p>Setup recurring deliveries</p>
              </div>
            </Link>
            
            <Link to="/cart" className="action-card">
              <div className="action-icon">🛒</div>
              <div className="action-content">
                <h3>Shopping Cart</h3>
                <p>Review and checkout your items</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="recent-orders">
          <div className="section-header">
            <h2>Recent Orders</h2>
            <Link to="/consumer/orders" className="view-all-link">
              View All →
            </Link>
          </div>
          
          <div className="orders-list">
            {analytics.recent_orders.length > 0 ? (
              analytics.recent_orders.map((order) => (
                <div key={order.order_id} className="order-item">
                  <div className="order-info">
                    <div className="order-number">#{order.order_number}</div>
                    <div className="order-date">{formatDate(order.created_at)}</div>
                  </div>
                  <div className="order-details">
                    <div className="order-amount">{formatPrice(order.amount)}</div>
                    <div className={`order-status status-${order.status.toLowerCase()}`}>
                      {order.status.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h3>No orders yet</h3>
                <p>Start shopping to see your order history</p>
                <Link to="/products" className="btn btn-primary">
                  🥬 Shop Now
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="order-breakdown">
          <h2>Order Status Breakdown</h2>
          <div className="status-grid">
            <div className="status-card">
              <div className="status-icon placed">📝</div>
              <div className="status-info">
                <div className="status-count">{analytics.orders.placed}</div>
                <div className="status-label">Placed</div>
              </div>
            </div>
            
            <div className="status-card">
              <div className="status-icon confirmed">✅</div>
              <div className="status-info">
                <div className="status-count">{analytics.orders.confirmed}</div>
                <div className="status-label">Confirmed</div>
              </div>
            </div>
            
            <div className="status-card">
              <div className="status-icon packed">�</div>
              <div className="status-info">
                <div className="status-count">{analytics.orders.packed}</div>
                <div className="status-label">Packed</div>
              </div>
            </div>
            
            <div className="status-card">
              <div className="status-icon delivered">🚚</div>
              <div className="status-info">
                <div className="status-count">{analytics.orders.delivered}</div>
                <div className="status-label">Delivered</div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        {analytics.subscriptions.active_subscriptions > 0 && (
          <div className="subscription-status">
            <h2>Subscription Overview</h2>
            <div className="subscription-cards">
              <div className="subscription-card active">
                <div className="subscription-icon">🔄</div>
                <div className="subscription-info">
                  <div className="subscription-count">{analytics.subscriptions.active_count}</div>
                  <div className="subscription-label">Active</div>
                </div>
              </div>
              
              <div className="subscription-card paused">
                <div className="subscription-icon">⏸️</div>
                <div className="subscription-info">
                  <div className="subscription-count">{analytics.subscriptions.paused_count}</div>
                  <div className="subscription-label">Paused</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ConsumerDashboard
