import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import dealerAPI from '../../services/dealerAPI';
import LoadingSpinner from '../../components/LoadingSpinner';
import DealerNavbar from '../../components/DealerNavbar';
import './DealerDashboard.css';

const Analytics = () => {
  const [analytics, setAnalytics] = useState({
    overview: {},
    revenueData: [],
    orderData: [],
    topProducts: [],
    ordersByStatus: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await dealerAPI.getDealerAnalytics({ period });
      if (response.data.success) {
        setAnalytics(response.data.data || analytics);
      }
    } catch (err) {
      setError('Failed to load analytics');
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="dealer-layout">
        <DealerNavbar />
        <div className="dealer-dashboard">
          <div className="dashboard-header">
            <h1>Analytics</h1>
          </div>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dealer-layout">
        <DealerNavbar />
        <div className="dealer-dashboard">
          <div className="dashboard-header">
            <h1>Analytics</h1>
          </div>
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchAnalytics} className="retry-button">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { overview, revenueData, orderData, topProducts, ordersByStatus } = analytics;

  return (
    <div className="dealer-layout">
      <DealerNavbar />
      <div className="dealer-dashboard">
        <div className="dashboard-header">
          <h1>Analytics</h1>
          <p>Track your business performance and insights</p>
        </div>

        {/* Period Selector */}
        <div className="time-range-selector">
          <label>Period:</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <h3>{overview.totalOrders || 0}</h3>
              <p>Total Orders</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>{formatPrice(overview.totalRevenue || 0)}</h3>
              <p>Total Revenue</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">�</div>
            <div className="stat-content">
              <h3>{formatPrice(overview.outgoing || 0)}</h3>
              <p>Outgoing (Pending)</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{formatPrice(overview.avgOrderValue || 0)}</h3>
              <p>Avg Order Value</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👨‍🌾</div>
            <div className="stat-content">
              <h3>{overview.totalFarmers || 0}</h3>
              <p>Total Farmers</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{overview.completedOrders || 0}</h3>
              <p>Completed Orders</p>
            </div>
          </div>
        </div>

        {/* Orders by Status */}
        <div className="analytics-section">
          <h2>Orders by Status</h2>
          <div className="status-chart">
            {Object.entries(ordersByStatus || {}).map(([status, count]) => (
              <div key={status} className="status-bar">
                <div className="status-label">{status.replace('_', ' ').toUpperCase()}</div>
                <div className="status-bar-fill" style={{ width: `${overview.totalOrders > 0 ? (count / overview.totalOrders) * 100 : 0}%` }}>
                  <span className="status-count">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="analytics-section">
          <h2>Revenue Trend</h2>
          <div className="revenue-chart">
            {revenueData && revenueData.length > 0 ? (
              <div className="chart-bars">
                {revenueData.map((data) => (
                  <div key={data.period} className="chart-bar-group">
                    <div
                      className="chart-bar"
                      style={{
                        height: `${Math.max(revenueData.map(d => d.revenue)) > 0 ? (data.revenue / Math.max(...revenueData.map(d => d.revenue))) * 100 : 0}%`
                      }}
                    >
                      <span className="bar-value">{formatPrice(data.revenue)}</span>
                    </div>
                    <span className="bar-label">{formatDate(data.period)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No revenue data available</p>
            )}
          </div>
        </div>

        {/* Order Trend */}
        <div className="analytics-section">
          <h2>Order Trend</h2>
          <div className="revenue-chart">
            {orderData && orderData.length > 0 ? (
              <div className="chart-bars">
                {orderData.map((data) => (
                  <div key={data.period} className="chart-bar-group">
                    <div
                      className="chart-bar"
                      style={{
                        height: `${Math.max(orderData.map(d => d.count)) > 0 ? (data.count / Math.max(...orderData.map(d => d.count))) * 100 : 0}%`,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      }}
                    >
                      <span className="bar-value">{data.count}</span>
                    </div>
                    <span className="bar-label">{formatDate(data.period)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No order data available</p>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="analytics-section">
          <h2>Top Purchased Products</h2>
          <div className="top-products">
            {topProducts && topProducts.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Total Quantity</th>
                    <th>Total Spent</th>
                    <th>Order Count</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product, index) => (
                    <tr key={index}>
                      <td>{product.name}</td>
                      <td>{product.totalQuantity}</td>
                      <td>{formatPrice(product.totalSpent)}</td>
                      <td>{product.orderCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">No product data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
