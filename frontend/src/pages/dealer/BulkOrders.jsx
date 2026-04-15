import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import dealerAPI from '../../services/dealerAPI';
import LoadingSpinner from '../../components/LoadingSpinner';
import DealerNavbar from '../../components/DealerNavbar';
import './DealerDashboard.css';
import './BulkOrders.css';

const BulkOrders = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const farmerId = searchParams.get('farmerId');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [createMode, setCreateMode] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [orderItems, setOrderItems] = useState([{ crop: '', quantity: '', price: '' }]);
  const [pickupDate, setPickupDate] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (farmerId) {
      setCreateMode(true);
      fetchFarmerDetails(farmerId);
    } else {
      setCreateMode(false);
      fetchOrders();
    }
  }, [farmerId, statusFilter]);

  const fetchFarmerDetails = async (id) => {
    try {
      setLoading(true);
      const response = await dealerAPI.getAvailableFarmers();
      if (response.data.success) {
        const farmer = response.data.data.find(f => f._id === id);
        setSelectedFarmer(farmer || null);
      }
    } catch (err) {
      setError('Failed to load farmer details');
      toast.error('Failed to load farmer details');
    } finally {
      setLoading(false);
    }
  };

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

  const handleAddOrderItem = () => {
    setOrderItems([...orderItems, { crop: '', quantity: '', price: '' }]);
  };

  const handleRemoveOrderItem = (index) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const handleOrderItemChange = (index, field, value) => {
    const updatedItems = [...orderItems];
    updatedItems[index][field] = value;
    setOrderItems(updatedItems);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!selectedFarmer) {
      toast.error('No farmer selected');
      return;
    }

    const validItems = orderItems.filter(item => item.crop && item.quantity !== '' && item.price !== '');
    if (validItems.length === 0) {
      toast.error('Please add at least one valid item to the order');
      return;
    }

    // Validate minimum 20kg per item
    const itemsBelowMinimum = validItems.filter(item => parseFloat(item.quantity) < 20);
    if (itemsBelowMinimum.length > 0) {
      toast.error('Each item must be at least 20kg for bulk orders');
      return;
    }

    // Validate total minimum 20kg
    const totalQuantity = validItems.reduce((sum, item) => sum + parseFloat(item.quantity), 0);
    if (totalQuantity < 20) {
      toast.error('Total order quantity must be at least 20kg for bulk orders');
      return;
    }

    if (!pickupDate) {
      toast.error('Please select a pickup date');
      return;
    }

    try {
      setCreating(true);
      // Backend expects specific item structure and address fields
      // Remove productId to avoid foreign key constraint issues with products table
      const orderData = {
        farmerId: farmerId,
        items: validItems.map(item => ({
          productName: item.crop,
          quantity: parseFloat(item.quantity),
          unit: 'kg',
          unitPrice: parseFloat(item.price)
        })),
        pickupDate: pickupDate,
        // Default address values to satisfy database constraints
        pickupAddress: 'Farm Location',
        pickupCity: 'Farm City',
        pickupState: 'Farm State',
        pickupPostalCode: '000000'
      };

      console.log('Creating bulk order with data:', orderData);

      const response = await dealerAPI.createBulkOrder(orderData);
      if (response.data.success) {
        toast.success('Bulk order created successfully');
        navigate('/dealer/bulk-orders');
      } else {
        toast.error(response.data.message || 'Failed to create order');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order');
    } finally {
      setCreating(false);
    }
  };

  const handleCancelCreate = () => {
    navigate('/dealer/bulk-orders');
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
      <div className="dealer-layout">
        <DealerNavbar />
        <div className="dealer-dashboard">
          <div className="dashboard-header">
            <h1>{createMode ? 'Create Bulk Order' : 'Bulk Orders'}</h1>
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
            <h1>{createMode ? 'Create Bulk Order' : 'Bulk Orders'}</h1>
          </div>
          <div className="error-message">
            <p>{error}</p>
            {createMode ? (
              <button onClick={handleCancelCreate} className="retry-button">
                Cancel
              </button>
            ) : (
              <button onClick={fetchOrders} className="retry-button">
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (createMode) {
    return (
      <div className="dealer-layout">
        <DealerNavbar />
        <div className="dealer-dashboard">
          <div className="dashboard-header">
            <h1>Create Bulk Order</h1>
            <Link to="/dealer/bulk-orders" className="back-button">← Back to Orders</Link>
          </div>

          <div className="create-order-container">
            {selectedFarmer ? (
              <div className="selected-farmer-info">
                <h3>Farmer: {selectedFarmer.users?.name}</h3>
                <p>{selectedFarmer.email}</p>
                <p>{selectedFarmer.phone}</p>
              </div>
            ) : (
              <div className="error-message">
                <p>Farmer not found</p>
                <Link to="/dealer/farmers" className="retry-button">
                  Select a Farmer
                </Link>
              </div>
            )}

            {selectedFarmer && (
              <form onSubmit={handleCreateOrder} className="create-order-form">
                <div className="order-items-section">
                  <h3>Order Items</h3>
                  {orderItems.map((item, index) => (
                    <div key={index} className="order-item-row">
                      <div className="item-field">
                        <label>Crop/Product Name</label>
                        <input
                          type="text"
                          value={item.crop}
                          onChange={(e) => handleOrderItemChange(index, 'crop', e.target.value)}
                          placeholder="e.g., Wheat, Rice"
                          required
                        />
                      </div>
                      <div className="item-field">
                        <label>Quantity (kg) - Minimum 20kg</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleOrderItemChange(index, 'quantity', e.target.value)}
                          min="20"
                          step="0.1"
                          required
                          placeholder="Enter quantity (min 20kg)"
                        />
                      </div>
                      <div className="item-field">
                        <label>Price per kg (₹)</label>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleOrderItemChange(index, 'price', e.target.value)}
                          min="0"
                          step="0.01"
                          required
                          placeholder="Enter price"
                        />
                      </div>
                      {orderItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOrderItem(index)}
                          className="remove-item-button"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddOrderItem}
                    className="add-item-button"
                  >
                    + Add Another Item
                  </button>
                </div>

                <div className="order-details-section">
                  <div className="detail-field">
                    <label>Pickup Date</label>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="order-summary">
                  <h3>Order Summary</h3>
                  <div className="summary-item">
                    <span>Total Items:</span>
                    <span>{orderItems.filter(item => item.crop && item.quantity !== '' && item.price !== '').length}</span>
                  </div>
                  <div className="summary-item">
                    <span>Total Amount:</span>
                    <span>{formatPrice(orderItems.reduce((sum, item) => {
                      if (item.quantity !== '' && item.price !== '') {
                        return sum + (parseFloat(item.quantity) * parseFloat(item.price));
                      }
                      return sum;
                    }, 0))}</span>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={handleCancelCreate}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="submit-button"
                  >
                    {creating ? 'Creating...' : 'Create Order'}
                  </button>
                </div>
              </form>
            )}
          </div>
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
