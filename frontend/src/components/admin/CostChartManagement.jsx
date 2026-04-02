import React, { useState, useEffect } from 'react';
import './CostChartManagement.css';

const CostChartManagement = () => {
  const [costChart, setCostChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const [formData, setFormData] = useState({
    vegetable_name: '',
    category: '',
    base_price: '',
    unit: 'kg'
  });

  const categories = [
    'Vegetables',
    'Fruits',
    'Leafy Greens',
    'Root Vegetables',
    'Herbs',
    'Others'
  ];

  const units = ['kg', 'gram', 'litre', 'piece'];

  const token = localStorage.getItem('token');

  // Fetch cost chart
  const fetchCostChart = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(filterCategory && { category: filterCategory }),
        ...(filterStatus && { is_active: filterStatus })
      });

      const response = await fetch(`/api/cost-chart?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setCostChart(data.data.costChart);
        setPagination(data.data.pagination);
      } else {
        setError(data.message || 'Failed to fetch cost chart');
      }
    } catch (error) {
      setError('Error fetching cost chart');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostChart();
  }, [pagination.page, searchTerm, filterCategory, filterStatus]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingEntry 
        ? `/api/cost-chart/${editingEntry._id}`
        : '/api/cost-chart';
      
      const method = editingEntry ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setShowModal(false);
        setEditingEntry(null);
        setFormData({
          vegetable_name: '',
          category: '',
          base_price: '',
          unit: 'kg'
        });
        fetchCostChart();
      } else {
        setError(data.message || 'Failed to save entry');
      }
    } catch (error) {
      setError('Error saving entry');
      console.error('Error:', error);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;

    try {
      const response = await fetch(`/api/cost-chart/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        fetchCostChart();
      } else {
        setError(data.message || 'Failed to delete entry');
      }
    } catch (error) {
      setError('Error deleting entry');
      console.error('Error:', error);
    }
  };

  // Handle edit
  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      vegetable_name: entry.vegetable_name,
      category: entry.category || '',
      base_price: entry.base_price,
      unit: entry.unit
    });
    setShowModal(true);
  };

  // Reset form
  const resetForm = () => {
    setEditingEntry(null);
    setFormData({
      vegetable_name: '',
      category: '',
      base_price: '',
      unit: 'kg'
    });
    setShowModal(false);
  };

  return (
    <div className="cost-chart-container">
      <div className="cost-chart-header">
        <div>
          <h1 className="cost-chart-title">Vegetable Cost Chart</h1>
          <p className="cost-chart-subtitle">Manage pricing and cost controls for all vegetables</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="add-entry-btn"
        >
          ➕ Add Entry
        </button>
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

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setFilterCategory('');
              setFilterStatus('');
            }}
            className="clear-filters-btn"
          >
            🔄 Clear Filters
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Cost Chart Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <span>Loading cost chart data...</span>
          </div>
        ) : costChart.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h3 className="empty-state-title">No Cost Chart Entries</h3>
            <p className="empty-state-description">
              Start by adding your first vegetable cost entry to manage pricing across the platform.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="add-entry-btn"
            >
              ➕ Add First Entry
            </button>
          </div>
        ) : (
          <>
            <table className="cost-chart-table">
              <thead>
                <tr>
                  <th>Vegetable Name</th>
                  <th>Category</th>
                  <th>Base Price</th>
                  <th>Min Price</th>
                  <th>Max Price</th>
                  <th>Unit</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {costChart.map((entry) => (
                  <tr key={entry._id}>
                    <td className="vegetable-name">{entry.vegetable_name}</td>
                    <td>
                      <span className={`category-badge category-${entry.category || 'vegetables'}`}>
                        {entry.category || 'vegetables'}
                      </span>
                    </td>
                    <td className="price-display">₹{entry.base_price}</td>
                    <td className="price-display">₹{entry.min_price}</td>
                    <td className="price-display">₹{entry.max_price}</td>
                    <td>{entry.unit}</td>
                    <td>
                      <span className={`status-badge ${entry.is_active ? 'status-active' : 'status-inactive'}`}>
                        {entry.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="action-btn edit-btn"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(entry._id)}
                          className="action-btn delete-btn"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination-container">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="pagination-btn"
              >
                ← Previous
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingEntry ? '✏️ Edit Entry' : '➕ Add New Entry'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="close-btn"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">
                  Vegetable Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.vegetable_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, vegetable_name: e.target.value }))}
                  className="form-input"
                  placeholder="e.g., Tomato"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="form-select"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Base Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, base_price: e.target.value }))}
                  className="form-input"
                  placeholder="e.g., 50.00"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Unit *
                </label>
                <select
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  className="form-select"
                >
                  <option value="kg">per kg</option>
                  <option value="gram">per gram</option>
                  <option value="litre">per litre</option>
                  <option value="piece">per piece</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="save-btn"
                >
                  {editingEntry ? '✏️ Update Entry' : '➕ Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostChartManagement;
