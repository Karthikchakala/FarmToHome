import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import dealerAPI from '../../services/dealerAPI';
import LoadingSpinner from '../../components/LoadingSpinner';
import DealerNavbar from '../../components/DealerNavbar';
import './DealerDashboard.css';

const Farmers = () => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    cropType: '',
    location: ''
  });

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    try {
      setLoading(true);
      const response = await dealerAPI.getAvailableFarmers(filters);
      if (response.data.success) {
        setFarmers(response.data.data || []);
      }
    } catch (err) {
      setError('Failed to load farmers');
      toast.error('Failed to load farmers');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    fetchFarmers();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="dealer-dashboard">
        <div className="dashboard-header">
          <h1>Browse Farmers</h1>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dealer-dashboard">
        <div className="dashboard-header">
          <h1>Browse Farmers</h1>
        </div>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchFarmers} className="retry-button">
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
        <h1>Browse Farmers</h1>
        <p>Find farmers with available products for bulk purchase</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <h2>Filter Farmers</h2>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Crop Type</label>
            <select
              name="cropType"
              value={filters.cropType}
              onChange={handleFilterChange}
            >
              <option value="">All Crops</option>
              <option value="vegetables">Vegetables</option>
              <option value="fruits">Fruits</option>
              <option value="grains">Grains</option>
              <option value="pulses">Pulses</option>
              <option value="spices">Spices</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Location</label>
            <input
              type="text"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              placeholder="Enter location"
            />
          </div>
          <button onClick={handleApplyFilters} className="apply-filters-button">
            Apply Filters
          </button>
        </div>
      </div>

      {/* Farmers Grid */}
      <div className="farmers-grid">
        {farmers.length === 0 ? (
          <div className="empty-state">
            <p>No farmers found matching your criteria</p>
            <button onClick={() => setFilters({ cropType: '', location: ''})} className="clear-filters-button">
              Clear Filters
            </button>
          </div>
        ) : (
          farmers.map((farmer) => (
            <div key={farmer._id} className="farmer-card">
              <div className="farmer-header">
                <div className="farmer-avatar">
                  {farmer.users?.profileimageurl ? (
                    <img src={farmer.users.profileimageurl} alt={farmer.users.name} />
                  ) : (
                    <span className="avatar-placeholder">{farmer.users?.name?.charAt(0)}</span>
                  )}
                </div>
                <div className="farmer-info">
                  <h3>{farmer.users?.name}</h3>
                  <p className="farmer-location">
                    📍 {farmer.farmname || 'Farm Location'}
                  </p>
                  {farmer.verificationstatus === 'verified' && (
                    <span className="verified-badge">✓ Verified</span>
                  )}
                </div>
              </div>

              <div className="farmer-products">
                <h4>Available Products</h4>
                {farmer.products?.length > 0 ? (
                  <div className="products-list">
                    {farmer.products.slice(0, 4).map((product) => (
                      <div key={product._id} className="product-item">
                        <span className="product-name">{product.name}</span>
                        <span className="product-price">{formatPrice(product.priceperunit)}/{product.unit}</span>
                        <span className="product-stock">{product.stockquantity} available</span>
                      </div>
                    ))}
                    {farmer.products.length > 4 && (
                      <p className="more-products">+{farmer.products.length - 4} more products</p>
                    )}
                  </div>
                ) : (
                  <p className="no-products">No products available</p>
                )}
              </div>

              <div className="farmer-actions">
                <Link
                  to={`/dealer/farmers/${farmer._id}`}
                  className="view-farmer-button"
                >
                  View Details
                </Link>
                <Link
                  to={`/dealer/bulk-orders/create?farmerId=${farmer._id}`}
                  className="create-order-button"
                >
                  Create Order
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
      </div>
    </div>
  );
};

export default Farmers;
