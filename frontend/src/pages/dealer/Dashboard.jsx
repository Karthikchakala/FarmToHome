import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dealerAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import DealerNavbar from '../../components/DealerNavbar';
import './DealerDashboard.css';

const DealerDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalFarmers: 0,
    totalRevenue: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent orders
      const ordersResponse = await dealerAPI.getDealerBulkOrders({ limit: 5 });
      if (ordersResponse.data.success) {
        const orders = ordersResponse.data.data;
        setRecentOrders(orders);
        
        // Calculate stats
        const stats = orders.reduce((acc, order) => {
          acc.totalOrders++;
          if (order.status === 'pending') acc.pendingOrders++;
          if (order.status === 'completed') acc.completedOrders++;
          if (order.status === 'completed') acc.totalRevenue += order.totalamount;
          return acc;
        }, { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalFarmers: 0, totalRevenue: 0 });
        
        setStats(stats);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
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
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#3b82f6';
      case 'picked_up': return '#8b5cf6';
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="dealer-dashboard">
        <div className="dashboard-header">
          <h1>Dealer Dashboard</h1>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dealer-dashboard">
        <div className="dashboard-header">
          <h1>Dealer Dashboard</h1>
        </div>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dealer-layout">
      <DealerNavbar />
      <div className="dealer-dashboard">
        <div className="dashboard-header">
          <h1>Dealer Dashboard</h1>
          <p>Manage your bulk purchases and farmer connections</p>
        </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">{"\ud83d\udce6"}</div>
          <div className="stat-content">
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">{"\u23f3"}</div>
          <div className="stat-content">
            <h3>{stats.pendingOrders}</h3>
            <p>Pending Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">{"\u2705"}</div>
          <div className="stat-content">
            <h3>{stats.completedOrders}</h3>
            <p>Completed Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">{"\ud83d\udcb0"}</div>
          <div className="stat-content">
            <h3>{formatPrice(stats.totalRevenue)}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/dealer/farmers" className="action-button">
            <span className="action-icon">{"\ud83c\udf3e"}</span>
            <span>Browse Farmers</span>
          </Link>
          <Link to="/dealer/bulk-orders/create" className="action-button">
            <span className="action-icon">{"\u2795"}</span>
            <span>Create Bulk Order</span>
          </Link>
          <Link to="/dealer/orders" className="action-button">
            <span className="action-icon">{"\ud83d\udccb"}</span>
            <span>View All Orders</span>
          </Link>
          <Link to="/dealer/profile" className="action-button">
            <span className="action-icon">{"\u2699\ufe0f"}</span>
            <span>Profile Settings</span>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="recent-orders">
        <div className="section-header">
          <h2>Recent Orders</h2>
          <Link to="/dealer/orders" className="view-all-link">
            View All
          </Link>
        </div>
        <div className="orders-table">
          {recentOrders.length === 0 ? (
            <div className="empty-state">
              <p>No recent orders found</p>
              <Link to="/dealer/farmers" className="create-order-button">
                Create Your First Order
              </Link>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Farmer</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td>{order.ordernumber}</td>
                    <td>{order.farmers?.users?.name}</td>
                    <td>{formatPrice(order.totalamount)}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>{formatDate(order.createdat)}</td>
                    <td>
                      <Link 
                        to={`/dealer/orders/${order._id}`} 
                        className="view-button"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default DealerDashboard;
