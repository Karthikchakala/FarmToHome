import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './FarmerCostChart.css';

const FarmerCostChart = () => {
  const [costChart, setCostChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchCostChart();
  }, []);

  const fetchCostChart = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cost-chart/reference`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setCostChart(data.data?.costChart || []);
      } else {
        setError('Failed to load cost chart data');
      }
    } catch (error) {
      console.error('Error fetching cost chart:', error);
      setError('Failed to load cost chart data');
    } finally {
      setLoading(false);
    }
  };

  const filteredCostChart = costChart.filter(item =>
    item.vegetable_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    item.is_active &&
    (filterCategory === '' || item.category === filterCategory)
  );

  const categories = [...new Set(costChart.map(item => item.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="farmer-cost-chart-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <span>Loading pricing information...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="farmer-cost-chart-container">
        <div className="error-container">
          <span className="error-icon">⚠️</span>
          <div>
            <h3>Pricing Information Unavailable</h3>
            <p>{error}</p>
            <button onClick={fetchCostChart} className="retry-btn">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="farmer-cost-chart-container">
      {/* Header */}
      <div className="cost-chart-header">
        <div className="header-content">
          <Link to="/farmer/products/add" className="back-link">
            ← Back to Add Product
          </Link>
          <h1 className="page-title">
            <span className="title-icon">📊</span>
            Vegetable Pricing Reference
          </h1>
          <p className="page-subtitle">
            Reference prices set by admin. Use these prices to set competitive pricing for your products.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🥬</div>
          <div className="stat-content">
            <div className="stat-number">{costChart.length}</div>
            <div className="stat-label">Total Vegetables</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-number">
              ₹{Math.round(costChart.reduce((sum, item) => sum + parseFloat(item.base_price || 0), 0) / costChart.length || 0)}
            </div>
            <div className="stat-label">Average Price/kg</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-number">±10%</div>
            <div className="stat-label">Price Flexibility</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="search-input">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search vegetables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-field"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setFilterCategory('');
            }}
            className="clear-filters-btn"
          >
            🔄 Clear Filters
          </button>
        </div>
      </div>

      {/* Pricing Guidelines */}
      <div className="guidelines-section">
        <h3 className="guidelines-title">
          <span className="title-icon">💡</span>
          Pricing Guidelines
        </h3>
        <div className="guidelines-grid">
          <div className="guideline-card">
            <h4>📊 Base Price</h4>
            <p>Reference price set by admin for each vegetable</p>
          </div>
          <div className="guideline-card">
            <h4>🎯 Price Range</h4>
            <p>You can set prices between 90% to 110% of base price</p>
          </div>
          <div className="guideline-card">
            <h4>⚠️ Validation</h4>
            <p>Prices outside the allowed range will be rejected</p>
          </div>
          <div className="guideline-card">
            <h4>🌟 Quality Factor</h4>
            <p>Consider quality, freshness, and market conditions</p>
          </div>
        </div>
      </div>

      {/* Cost Chart Table */}
      <div className="table-container">
        <h3 className="table-title">
          <span className="title-icon">📋</span>
          Complete Price List
          <span className="results-count">({filteredCostChart.length} items)</span>
        </h3>
        
        {filteredCostChart.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <h4>No vegetables found</h4>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="cost-chart-table">
              <thead>
                <tr>
                  <th>Vegetable</th>
                  <th>Category</th>
                  <th>Base Price</th>
                  <th>Min Price</th>
                  <th>Max Price</th>
                  <th>Price Range</th>
                </tr>
              </thead>
              <tbody>
                {filteredCostChart.map((item) => (
                  <tr key={item._id}>
                    <td className="vegetable-name">
                      <span className="vegetable-icon">🥬</span>
                      {item.vegetable_name}
                    </td>
                    <td>
                      <span className="category-badge category-${item.category || 'vegetables'}">
                        {item.category || 'vegetables'}
                      </span>
                    </td>
                    <td className="price-display base-price">₹{item.base_price}</td>
                    <td className="price-display min-price">₹{item.min_price}</td>
                    <td className="price-display max-price">₹{item.max_price}</td>
                    <td>
                      <div className="price-range-bar">
                        <div className="range-indicator">
                          <span className="range-min">₹{item.min_price}</span>
                          <span className="range-base">₹{item.base_price}</span>
                          <span className="range-max">₹{item.max_price}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Section */}
      <div className="action-section">
        <div className="action-content">
          <h3>Ready to Add Your Product?</h3>
          <p>Use the pricing information above to set competitive prices for your vegetables.</p>
          <Link to="/farmer/products/add" className="add-product-btn">
            ➕ Add New Product
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FarmerCostChart;
