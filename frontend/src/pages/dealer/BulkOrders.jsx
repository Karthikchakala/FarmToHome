import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import dealerAPI from '../../services/dealerAPI';
import LoadingSpinner from '../../components/LoadingSpinner';
import DealerNavbar from '../../components/DealerNavbar';
import './DealerDashboard.css';

const BulkOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await dealerAPI.getDealerBulkOrders(params);
      if (response.data.success) {
        setOrders(response.data.data || []);
      }
    } catch (err) {
      setError('Failed to load orders');
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await dealerAPI.updateBulkOrderStatus(orderId, { status: newStatus });
      if (response.data.success) {
        toast.success('Order status updated');
        fetchOrders();
      }
    } catch (err) {
      toast.error('Failed to update order status');
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
          <h1>Bulk Orders</h1>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dealer-dashboard">
        <div className="dashboard-header">
          <h1>Bulk Orders</h1>
        </div>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchOrders} className="retry-button">
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
          <h1>Bulk Orders</h1>
          <p>Manage your bulk purchase orders</p>
        </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Orders</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="picked_up">Picked Up</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <Link to="/dealer/farmers" className="create-new-order-button">
            + Create New Order
          </Link>
        </div>
      </div>

      {/* Orders Table */}
      <div className="orders-section">
        {orders.length === 0 ? (
          <div className="empty-state">
            <p>No orders found</p>
            <Link to="/dealer/farmers" className="create-order-button">
              Create Your First Order
            </Link>
          </div>
        ) : (
          <div className="orders-table">
            <table>
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Farmer</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Pickup Date</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
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
                    <td>{order.pickupdate ? formatDate(order.pickupdate) : 'N/A'}</td>
                    <td>{formatDate(order.createdat)}</td>
                    <td>
                      <div className="action-buttons">
                        <Link to={`/dealer/orders/${order._id}`} className="view-button">
                          View
                        </Link>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleStatusUpdate(order._id, 'confirmed')}
                            className="confirm-button"
                          >
                            Confirm
                          </button>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusUpdate(order._id, 'picked_up')}
                            className="pickup-button"
                          >
                            Mark Picked Up
                          </button>
                        )}
                        {order.status === 'picked_up' && (
                          <button
                            onClick={() => handleStatusUpdate(order._id, 'completed')}
                            className="complete-button"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default BulkOrders;
