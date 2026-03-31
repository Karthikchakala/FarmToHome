import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { farmerAPI } from '../../services/farmerAPI'
import LoadingSpinner from '../../components/LoadingSpinner'
import './StockManagement.css'

const StockManagement = () => {
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stockItems, setStockItems] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [lowStockAlerts, setLowStockAlerts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [updateForm, setUpdateForm] = useState({
    stockQuantity: '',
    pricePerUnit: ''
  })
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch all data in parallel
        const [productsRes, statsRes, alertsRes] = await Promise.all([
          farmerAPI.getFarmerProducts(),
          farmerAPI.getStockStatistics(),
          farmerAPI.getLowStockAlerts()
        ])

        console.log('API Responses:', {
          products: productsRes.data,
          stats: statsRes.data,
          alerts: alertsRes.data
        })

        // Handle products response - ensure it's always an array
        let products = []
        if (productsRes.data?.success) {
          if (Array.isArray(productsRes.data.products)) {
            products = productsRes.data.products
          } else if (Array.isArray(productsRes.data.data?.products)) {
            products = productsRes.data.data.products
          } else if (Array.isArray(productsRes.data.data)) {
            products = productsRes.data.data
          }
        }
        
        console.log('Setting stock items:', products)
        setStockItems(products)

        if (statsRes.data?.success) {
          setStatistics(statsRes.data.data)
        }

        if (alertsRes.data?.success) {
          setLowStockAlerts(alertsRes.data.alerts || [])
        }

      } catch (error) {
        console.error('Error fetching stock data:', error)
        setStockItems([]) // Ensure stockItems is always an array
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated])

  const handleStockUpdate = async () => {
    if (!selectedProduct) return

    try {
      setUpdating(true)
      
      const updateData = {
        stockquantity: parseFloat(updateForm.stockQuantity),
        priceperunit: parseFloat(updateForm.pricePerUnit)
      }

      const response = await farmerAPI.updateStock(selectedProduct._id, updateData)

      if (response.data.success) {
        // Update the local state
        setStockItems(prev => prev.map(item => 
          item._id === selectedProduct._id 
            ? { 
                ...item, 
                stockquantity: updateData.stockquantity,
                priceperunit: updateData.priceperunit
              }
            : item
        ))

        setShowUpdateModal(false)
        setSelectedProduct(null)
        setUpdateForm({ stockQuantity: '', pricePerUnit: '' })
        
        // Refresh data
        window.location.reload()
      }
    } catch (error) {
      console.error('Error updating stock:', error)
    } finally {
      setUpdating(false)
    }
  }

  const openUpdateModal = (product) => {
    setSelectedProduct(product)
    setUpdateForm({
      stockQuantity: product.stockquantity || '',
      pricePerUnit: product.priceperunit || ''
    })
    setShowUpdateModal(true)
  }

  const getStockStatus = (product) => {
    const currentStock = product.stockquantity || 0
    const minAlert = product.minstockalert || 10
    
    if (currentStock === 0) return { status: 'OUT_OF_STOCK', color: '#dc3545', label: 'Out of Stock' }
    if (currentStock <= minAlert) return { status: 'LOW_STOCK', color: '#ffc107', label: 'Low Stock' }
    return { status: 'IN_STOCK', color: '#28a745', label: 'In Stock' }
  }

  const filteredStockItems = Array.isArray(stockItems) ? stockItems.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    const stockStatus = getStockStatus(item)
    const matchesFilter = filterStatus === 'all' || stockStatus.status === filterStatus
    return matchesSearch && matchesFilter
  }) : []

  if (!isAuthenticated) {
    return (
      <div className="stock-management">
        <div className="auth-message">
          <h2>Please login to manage your stock</h2>
        </div>
      </div>
    )
  }

  if (loading) {
    return <LoadingSpinner size="large" text="Loading stock data..." />
  }

  return (
    <div className="stock-management">
      <div className="page-header">
        <h1>📦 Stock Management</h1>
        <p>Manage your inventory levels and track product availability</p>
      </div>

      {/* Quick Summary */}
      {statistics && (
        <div className="summary-section">
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Total Products</span>
              <span className="summary-value">{statistics.totalProducts}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">In Stock</span>
              <span className="summary-value available">{statistics.availableProducts}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Low Stock</span>
              <span className="summary-value low-stock">{statistics.lowStockProducts}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Out of Stock</span>
              <span className="summary-value out-of-stock">{statistics.outOfStockProducts}</span>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Grid */}
      <div className="products-section">
        <div className="products-grid">
          {!Array.isArray(stockItems) || stockItems.length === 0 ? (
            <div className="no-products">
              <p>No products found. Add products to manage your stock.</p>
            </div>
          ) : (
            stockItems.map(item => {
              const stockStatus = getStockStatus(item)
              return (
                <div key={item._id} className="product-card">
                  <div className="product-header">
                    <div className="product-info">
                      <h3>{item.name || 'Unknown Product'}</h3>
                      <span className="category-badge">{item.category || 'uncategorized'}</span>
                    </div>
                    <div className="product-status">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: stockStatus.color }}
                      >
                        {stockStatus.label}
                      </span>
                    </div>
                  </div>
                  
                  <div className="product-details">
                    <div className="detail-row">
                      <span className="label">Current Stock:</span>
                      <span className="value stock-value">
                        {item.stockquantity || 0} {item.unit || 'unit'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Price per Unit:</span>
                      <span className="value price-value">
                        ₹{item.priceperunit || 0}/{item.unit || 'unit'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Availability:</span>
                      <span className={`value availability-value ${item.isavailable ? 'available' : 'unavailable'}`}>
                        {item.isavailable ? '✅ Available' : '❌ Unavailable'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Low Stock Alert:</span>
                      <span className="value alert-value">
                        ≤ 10 {item.unit || 'unit'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="product-actions">
                    <button 
                      onClick={() => openUpdateModal(item)}
                      className="btn btn-primary"
                    >
                      📝 Edit Stock
                    </button>
                    <button 
                      onClick={() => window.location.href = `/farmer/products/${item._id}`}
                      className="btn btn-secondary"
                    >
                      🔧 Full Details
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <div className="alerts-section">
          <h2>⚠️ Low Stock Alerts</h2>
          <div className="alerts-grid">
            {lowStockAlerts.map(alert => (
              <div key={alert._id} className="alert-card">
                <div className="alert-header">
                  <h4>{alert.productName}</h4>
                  <span className="alert-badge">Low Stock</span>
                </div>
                <p>Current: {alert.currentStock} {alert.unit}</p>
                <p>Min Alert: {alert.minStockAlert} {alert.unit}</p>
                <button 
                  onClick={() => openUpdateModal(alert)}
                  className="btn btn-warning btn-sm"
                >
                  Update Stock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Management Table */}
      <div className="stock-container">
        <div className="stock-header">
          <h2>Inventory Management</h2>
          <div className="stock-controls">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </div>

        {filteredStockItems.length === 0 ? (
          <div className="no-data">
            <p>No products found matching your criteria.</p>
          </div>
        ) : (
          <div className="stock-table">
            <div className="table-header">
              <div>Product</div>
              <div>Current Stock</div>
              <div>Min Alert</div>
              <div>Price</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            {filteredStockItems.map(item => {
              const stockStatus = getStockStatus(item)
              return (
                <div key={item._id} className="table-row">
                  <div className="product-info">
                    <div className="product-name">{item.name}</div>
                    <div className="product-category">{item.category}</div>
                  </div>
                  <div className="stock-quantity">
                    <span className="quantity">{item.stockquantity || 0}</span>
                    <span className="unit">{item.unit}</span>
                  </div>
                  <div className="min-stock">
                    {item.minstockalert || 10} {item.unit}
                  </div>
                  <div className="price">
                    ₹{item.priceperunit}/{item.unit}
                  </div>
                  <div className="status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: stockStatus.color }}
                    >
                      {stockStatus.label}
                    </span>
                  </div>
                  <div className="actions">
                    <button 
                      onClick={() => openUpdateModal(item)}
                      className="btn btn-primary btn-sm"
                    >
                      Update
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Update Stock Modal */}
      {showUpdateModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Update Stock - {selectedProduct.name}</h3>
              <button 
                onClick={() => setShowUpdateModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Stock Quantity ({selectedProduct.unit})</label>
                <input
                  type="number"
                  step="0.001"
                  value={updateForm.stockQuantity}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, stockQuantity: e.target.value }))}
                  placeholder="Enter stock quantity"
                />
              </div>
              <div className="form-group">
                <label>Price per Unit (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={updateForm.pricePerUnit}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, pricePerUnit: e.target.value }))}
                  placeholder="Price per unit"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowUpdateModal(false)}
                className="btn btn-secondary"
                disabled={updating}
              >
                Cancel
              </button>
              <button 
                onClick={handleStockUpdate}
                className="btn btn-primary"
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Update Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StockManagement
