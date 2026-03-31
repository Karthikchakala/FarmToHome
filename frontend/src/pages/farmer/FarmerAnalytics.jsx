import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/Card'
import Button from '../../components/Button'
import farmerAPI from '../../services/farmerAPI'
import './FarmerAnalytics.css'

const FarmerAnalytics = () => {
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState({
    overview: {
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      activeCustomers: 0
    },
    salesData: [],
    productPerformance: [],
    recentOrders: [],
    customerInsights: {
      newCustomers: 0,
      returningCustomers: 0,
      topLocations: []
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState('30days') // 7days, 30days, 90days, 1year

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await farmerAPI.getAnalytics(timeRange)
      
      if (response.data.success) {
        setAnalytics(response.data.analytics)
      } else {
        setError('Failed to load analytics data')
      }
    } catch (err) {
      console.error('Error loading analytics:', err)
      setError('Failed to load analytics data')
      
      // Set mock data for development
      setAnalytics({
        overview: {
          totalRevenue: 125000,
          totalOrders: 48,
          totalProducts: 15,
          activeCustomers: 32
        },
        salesData: [
          { date: '2026-03-20', revenue: 5000, orders: 2 },
          { date: '2026-03-21', revenue: 8000, orders: 3 },
          { date: '2026-03-22', revenue: 12000, orders: 5 },
          { date: '2026-03-23', revenue: 6000, orders: 2 },
          { date: '2026-03-24', revenue: 15000, orders: 6 },
          { date: '2026-03-25', revenue: 9000, orders: 4 },
          { date: '2026-03-26', revenue: 11000, orders: 5 },
          { date: '2026-03-27', revenue: 13000, orders: 6 }
        ],
        productPerformance: [
          { name: 'Organic Tomatoes', sales: 45, revenue: 22500 },
          { name: 'Fresh Carrots', sales: 38, revenue: 15200 },
          { name: 'Green Spinach', sales: 32, revenue: 12800 },
          { name: 'Potatoes', sales: 28, revenue: 11200 },
          { name: 'Onions', sales: 25, revenue: 10000 }
        ],
        recentOrders: [
          { id: 'ORD001', customer: 'John Doe', amount: 2500, status: 'delivered', date: '2026-03-27' },
          { id: 'ORD002', customer: 'Jane Smith', amount: 1800, status: 'pending', date: '2026-03-27' },
          { id: 'ORD003', customer: 'Mike Johnson', amount: 3200, status: 'processing', date: '2026-03-26' },
          { id: 'ORD004', customer: 'Sarah Williams', amount: 1500, status: 'delivered', date: '2026-03-26' },
          { id: 'ORD005', customer: 'David Brown', amount: 2800, status: 'pending', date: '2026-03-25' }
        ],
        customerInsights: {
          newCustomers: 12,
          returningCustomers: 20,
          topLocations: [
            { location: 'Hitech City, Hyderabad', orders: 15 },
            { location: 'Banjara Hills, Hyderabad', orders: 12 },
            { location: 'Jubilee Hills, Hyderabad', orders: 8 },
            { location: 'Madhapur, Hyderabad', orders: 6 },
            { location: 'Kondapur, Hyderabad', orders: 5 }
          ]
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      delivered: 'success',
      pending: 'warning',
      processing: 'info',
      cancelled: 'error'
    }
    return colors[status] || 'default'
  }

  // Comprehensive safety check before rendering
  const safeAnalytics = analytics || {
    overview: { totalRevenue: 0, totalOrders: 0, totalProducts: 0, activeCustomers: 0 },
    salesData: [],
    productPerformance: [],
    recentOrders: [],
    customerInsights: { newCustomers: 0, returningCustomers: 0, topLocations: [] }
  }

  // Calculate max value for bar charts with safe defaults
  const maxSales = safeAnalytics.productPerformance && safeAnalytics.productPerformance.length > 0 ? 
    Math.max(...safeAnalytics.productPerformance.map(p => p.sales || 0), 1) : 1
  const maxLocationOrders = safeAnalytics.customerInsights && safeAnalytics.customerInsights.topLocations && safeAnalytics.customerInsights.topLocations.length > 0 ? 
    Math.max(...safeAnalytics.customerInsights.topLocations.map(l => l.orders || 0), 1) : 1

  // Return early if still loading to prevent accessing undefined properties
  if (loading) {
    console.log('Analytics loading, showing loader...')
    return (
      <div className="farmer-analytics">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  console.log('Analytics state:', analytics)

  return (
    <div className="farmer-analytics">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-left">
          <h1>📊 Farm Analytics Dashboard</h1>
          <p>Track your farm's performance and sales insights</p>
        </div>
        <div className="header-right">
          <div className="time-range-selector">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="time-range-dropdown"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="1year">Last Year</option>
            </select>
          </div>
          <Button 
            onClick={() => navigate('/farmer/profile')} 
            variant="outline"
            size="small"
          >
            ← Back to Profile
          </Button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="analytics-content">
        {/* Overview Cards */}
        <div className="overview-cards">
          <Card className="overview-card revenue">
            <div className="card-icon">💰</div>
            <div className="card-content">
              <h3>Total Revenue</h3>
              <div className="card-value">{formatCurrency(safeAnalytics.overview?.totalRevenue || 0)}</div>
              <div className="card-change positive">+12% from last period</div>
            </div>
          </Card>

          <Card className="overview-card orders">
            <div className="card-icon">📦</div>
            <div className="card-content">
              <h3>Total Orders</h3>
              <div className="card-value">{safeAnalytics.overview?.totalOrders || 0}</div>
              <div className="card-change positive">+8% from last period</div>
            </div>
          </Card>

          <Card className="overview-card products">
            <div className="card-icon">🥬</div>
            <div className="card-content">
              <h3>Active Products</h3>
              <div className="card-value">{safeAnalytics.overview?.totalProducts || 0}</div>
              <div className="card-change neutral">No change</div>
            </div>
          </Card>

          <Card className="overview-card customers">
            <div className="card-icon">👥</div>
            <div className="card-content">
              <h3>Active Customers</h3>
              <div className="card-value">{safeAnalytics.overview?.activeCustomers || 0}</div>
              <div className="card-change positive">+15% from last period</div>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="charts-row">
          {/* Sales Chart */}
          <Card className="chart-card sales-chart">
            <h3>📈 Sales Trend</h3>
            <div className="chart-container">
              <div className="sales-bars">
                {(safeAnalytics.salesData || []).map((day, index) => {
                  const maxRevenue = Math.max(...(safeAnalytics.salesData || []).map(d => d.revenue || 0), 1)
                  const height = (day.revenue / maxRevenue) * 100
                  return (
                    <div key={index} className="bar-wrapper">
                      <div 
                        className="bar" 
                        style={{ height: `${height}%` }}
                        title={`${formatDate(day.date)}: ${formatCurrency(day.revenue)} (${day.orders} orders)`}
                      >
                        <span className="bar-value">{formatCurrency(day.revenue)}</span>
                      </div>
                      <span className="bar-label">{new Date(day.date).getDate()}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="chart-summary">
              <div className="summary-item">
                <span className="label">Avg. Daily Revenue:</span>
                <span className="value">
                  {formatCurrency((safeAnalytics.salesData || []).reduce((sum, day) => sum + day.revenue, 0) / (safeAnalytics.salesData?.length || 1))}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Total Orders:</span>
                <span className="value">
                  {(safeAnalytics.salesData || []).reduce((sum, day) => sum + day.orders, 0)}
                </span>
              </div>
            </div>
          </Card>

          {/* Product Performance */}
          <Card className="chart-card product-chart">
            <h3>🥇 Top Products</h3>
            <div className="chart-container">
              <div className="product-bars">
                {(safeAnalytics.productPerformance || []).map((product, index) => {
                  const width = (product.sales / maxSales) * 100
                  return (
                    <div key={index} className="product-bar-wrapper">
                      <div className="product-info">
                        <span className="product-name">{product.name}</span>
                        <span className="product-sales">{product.sales} sold</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${width}%` }}
                        ></div>
                      </div>
                      <span className="product-revenue">{formatCurrency(product.revenue)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* Customer Insights & Recent Orders */}
        <div className="insights-row">
          {/* Customer Insights */}
          <Card className="insights-card customer-insights">
            <h3>👥 Customer Insights</h3>
            <div className="customer-stats">
              <div className="stat-item">
                <div className="stat-value">{safeAnalytics.customerInsights?.newCustomers || 0}</div>
                <div className="stat-label">New Customers</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{safeAnalytics.customerInsights?.returningCustomers || 0}</div>
                <div className="stat-label">Returning Customers</div>
              </div>
            </div>
            
            <div className="top-locations">
              <h4>📍 Top Delivery Locations</h4>
              <div className="location-bars">
                {(safeAnalytics.customerInsights?.topLocations || []).map((location, index) => {
                  const width = (location.orders / maxLocationOrders) * 100
                  return (
                    <div key={index} className="location-bar-wrapper">
                      <div className="location-info">
                        <span className="location-name">{location.location}</span>
                        <span className="location-orders">{location.orders} orders</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill location" 
                          style={{ width: `${width}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>

          {/* Recent Orders */}
          <Card className="insights-card recent-orders">
            <h3>📦 Recent Orders</h3>
            <div className="orders-list">
              {(safeAnalytics.recentOrders || []).map((order, index) => (
                <div key={index} className="order-item">
                  <div className="order-header">
                    <span className="order-id">{order.id}</span>
                    <span className={`order-status ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="order-details">
                    <span className="customer-name">{order.customer}</span>
                    <span className="order-amount">{formatCurrency(order.amount)}</span>
                  </div>
                  <div className="order-date">{formatDate(order.date)}</div>
                </div>
              ))}
            </div>
            <Button 
              onClick={() => navigate('/farmer/orders')} 
              variant="outline" 
              size="small"
              className="view-all-btn"
            >
              View All Orders
            </Button>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>⚡ Quick Actions</h3>
          <div className="action-buttons">
            <Button 
              onClick={() => navigate('/farmer/products')} 
              variant="primary"
            >
              🥬 Manage Products
            </Button>
            <Button 
              onClick={() => navigate('/farmer/stock')} 
              variant="outline"
            >
              📊 Update Stock
            </Button>
            <Button 
              onClick={() => navigate('/farmer/orders')} 
              variant="outline"
            >
              📦 View Orders
            </Button>
            <Button 
              onClick={() => navigate('/farmer/profile')} 
              variant="outline"
            >
              👤 Edit Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FarmerAnalytics
