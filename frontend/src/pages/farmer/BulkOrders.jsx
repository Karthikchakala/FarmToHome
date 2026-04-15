import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import farmerAPI from '../../services/farmerAPI';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../dealer/BulkOrders.css';

const FarmerBulkOrders = () => {
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
      const response = await farmerAPI.getFarmerBulkOrders(params);
      if (response.data.success) {
        setOrders(response.data.data || []);
      } else {
        setError(response.data.error || 'Failed to load orders');
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
      const response = await farmerAPI.updateBulkOrderStatus(orderId, { status: newStatus });
      if (response.data.success) {
        toast.success(`Order ${newStatus} successfully`);
        fetchOrders();
      } else {
        toast.error(response.data.error || 'Failed to update order status');
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
      case 'rejected': return '#6b7280';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="dealer-layout">
        <div className="dealer-dashboard">
          <div className="dashboard-header">
            <h1>Bulk Orders from Dealers</h1>
          </div>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dealer-layout">
        <div className="dealer-dashboard">
          <div className="dashboard-header">
            <h1>Bulk Orders from Dealers</h1>
          </div>
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchOrders} className="retry-button">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dealer-layout">
      <div className="dealer-dashboard">
        <div className="dashboard-header">
          <h1>Bulk Orders from Dealers</h1>
          <p>Review and respond to bulk purchase orders from dealers</p>
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
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="orders-section">
          {orders.length === 0 ? (
            <div className="empty-state">
              <p>No bulk orders from dealers found</p>
              <p>Dealers will send bulk purchase orders here for your products</p>
            </div>
          ) : (
            <div className="orders-table">
              <table>
                <thead>
                  <tr>
                    <th>Order Number</th>
                    <th>Dealer</th>
                    <th>Items</th>
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
                      <td>{order.dealers?.users?.name || 'Unknown Dealer'}</td>
                      <td>
                        <div className="order-items-preview">
                          {order.items && order.items.map((item, idx) => (
                            <span key={idx}>{item.crop} ({item.quantity}kg)</span>
                          ))}
                        </div>
                      </td>
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
                          {order.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(order._id, 'confirmed')}
                                className="confirm-button"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(order._id, 'rejected')}
                                className="cancel-button"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {order.status === 'confirmed' && (
                            <button
                              onClick={() => handleStatusUpdate(order._id, 'completed')}
                              className="complete-button"
                            >
                              Mark Ready for Pickup
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

export default FarmerBulkOrders;
