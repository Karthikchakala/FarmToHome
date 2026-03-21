import { useState, useEffect } from 'react'
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { farmerAPI } from '../../services/farmerAPI'
import LoadingSpinner from '../../components/LoadingSpinner'
import './ProductManagement.css'

const ProductManagement = () => {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  
  // Form state for add/edit mode
  const [formData, setFormData] = useState({
    name: '',
    category: 'vegetables',
    description: '',
    priceperunit: '',
    unit: 'kg',
    stockquantity: '',
    minorderquantity: '',
    isavailable: true,
    images: [],
    harvestdate: '',
    expirydate: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  // Determine the current mode based on URL
  const isAddMode = location.pathname.includes('/add') || location.pathname.includes('/new')
  const isEditMode = !!id
  const isListMode = !isAddMode && !isEditMode

  useEffect(() => {
    // Only fetch products when in list mode
    if (!isListMode) {
      setLoading(false)
      return
    }

    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await farmerAPI.getFarmerProducts()
        setProducts(response.data.data?.products || [])
      } catch (error) {
        console.error('Error fetching products:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchProducts()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, isListMode])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'available' && product.isavailable) ||
                         (filterStatus === 'out-of-stock' && product.stockquantity === 0)
    return matchesSearch && matchesFilter
  })

  const handleDeleteProduct = (product) => {
    setProductToDelete(product)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    try {
      await farmerAPI.deleteProduct(productToDelete._id)
      setProducts(products.filter(p => p._id !== productToDelete._id))
      setShowDeleteModal(false)
      setProductToDelete(null)
      alert('Product deleted successfully!')
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product. Please try again.')
    }
  }

  const toggleAvailability = async (productId) => {
    try {
      const product = products.find(p => p._id === productId)
      const response = await farmerAPI.toggleAvailability(productId, {
        isAvailable: !product.isAvailable
      })
      
      setProducts(products.map(p => 
        p._id === productId 
          ? { ...p, isAvailable: !p.isAvailable }
          : p
      ))
    } catch (error) {
      console.error('Error toggling availability:', error)
      alert('Failed to update availability. Please try again.')
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    const imageUrls = files.map(file => URL.createObjectURL(file))
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...imageUrls]
    }))
  }

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')

    try {
      // Prepare product data for API with correct field names
      const productData = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: parseFloat(formData.price),
        unit: formData.unit,
        stockQuantity: parseInt(formData.stockQuantity),
        minimumOrder: parseInt(formData.minimumOrder),
        isAvailable: formData.isAvailable,
        images: formData.images,
        harvestDate: formData.harvestDate,
        expiryDate: formData.expiryDate
      }

      let response
      if (isEditMode) {
        response = await farmerAPI.updateProduct(id, productData)
      } else {
        response = await farmerAPI.addProduct(productData)
      }

      // Reset form
      setFormData({
        name: '',
        category: 'vegetables',
        description: '',
        price: '',
        unit: 'kg',
        stockQuantity: '',
        minimumOrder: '',
        isAvailable: true,
        images: [],
        harvestDate: '',
        expiryDate: ''
      })
      
      // Show success message and redirect
      alert(`${isEditMode ? 'Product updated' : 'Product added'} successfully!`)
      navigate('/farmer/products')
      
    } catch (error) {
      console.error('Error saving product:', error)
      setFormError(error.response?.data?.message || 'Failed to save product. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="product-management">
        <div className="auth-message">
          <h2>Please login to manage your products</h2>
          <Link to="/login" className="btn btn-primary">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return <LoadingSpinner size="large" text="Loading products..." />
  }

  // Show Add/Edit Product Form
  if (isAddMode || isEditMode) {
    return (
      <div className="product-management">
        <div className="page-header">
          <h1>{isEditMode ? '✏️ Edit Product' : '➕ Add New Product'}</h1>
          <div className="header-actions">
            <Link to="/farmer/products" className="btn btn-secondary">
              ← Back to Products
            </Link>
          </div>
        </div>
        
        <div className="product-form-container">
          <div className="form-card">
            <h2>{isEditMode ? 'Edit Product Details' : 'Add New Product'}</h2>
            <p>
              {isEditMode 
                ? 'Update your product information below.'
                : 'Fill in the details below to add a new product to your catalog.'
              }
            </p>
            
            {formError && (
              <div className="error-message">
                {formError}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-grid">
                {/* Left Column */}
                <div className="form-column">
                  <div className="form-group">
                    <label htmlFor="name">Product Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Fresh Tomatoes"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="category">Category *</label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="vegetables">Vegetables</option>
                      <option value="fruits">Fruits</option>
                      <option value="grains">Grains</option>
                      <option value="dairy">Dairy</option>
                      <option value="herbs">Herbs</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="description">Description *</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows="4"
                      placeholder="Describe your product, growing methods, taste, etc."
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="growingMethod">Growing Method</label>
                    <select
                      id="growingMethod"
                      name="growingMethod"
                      value={formData.growingMethod}
                      onChange={handleInputChange}
                    >
                      <option value="organic">Organic</option>
                      <option value="conventional">Conventional</option>
                      <option value="hydroponic">Hydroponic</option>
                      <option value="greenhouse">Greenhouse</option>
                    </select>
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="form-column">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="price">Price *</label>
                      <div className="input-with-unit">
                        <input
                          type="number"
                          id="price"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          required
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                        <select
                          name="unit"
                          value={formData.unit}
                          onChange={handleInputChange}
                        >
                          <option value="kg">per kg</option>
                          <option value="gram">per gram</option>
                          <option value="litre">per litre</option>
                          <option value="piece">per piece</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="stockQuantity">Stock Quantity *</label>
                      <input
                        type="number"
                        id="stockQuantity"
                        name="stockQuantity"
                        value={formData.stockQuantity}
                        onChange={handleInputChange}
                        required
                        min="0"
                        placeholder="Available quantity"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="minimumOrder">Minimum Order *</label>
                      <input
                        type="number"
                        id="minimumOrder"
                        name="minimumOrder"
                        value={formData.minimumOrder}
                        onChange={handleInputChange}
                        required
                        min="0"
                        placeholder="Minimum order quantity"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="harvestDate">Harvest Date</label>
                    <input
                      type="date"
                      id="harvestDate"
                      name="harvestDate"
                      value={formData.harvestDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="shelfLife">Shelf Life (days)</label>
                    <input
                      type="number"
                      id="shelfLife"
                      name="shelfLife"
                      value={formData.shelfLife}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="e.g., 7"
                    />
                  </div>
                </div>
              </div>
              
              {/* Product Images */}
              <div className="form-section">
                <label>Product Images</label>
                <div className="image-upload-area">
                  <div className="uploaded-images">
                    {formData.images.map((image, index) => (
                      <div key={index} className="image-preview">
                        <img src={image} alt={`Product ${index + 1}`} />
                        <button
                          type="button"
                          className="remove-image"
                          onClick={() => removeImage(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="upload-button">
                    <input
                      type="file"
                      id="images"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="images" className="btn btn-secondary">
                      📷 Upload Images
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Storage Instructions */}
              <div className="form-group full-width">
                <label htmlFor="storageInstructions">Storage Instructions</label>
                <textarea
                  id="storageInstructions"
                  name="storageInstructions"
                  value={formData.storageInstructions}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="How should customers store this product?"
                />
              </div>
              
              {/* Availability */}
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={handleInputChange}
                  />
                  Product is available for sale
                </label>
              </div>
              
              {/* Form Actions */}
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <span className="spinner"></span>
                      {isEditMode ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      {isEditMode ? '✏️ Update Product' : '➕ Add Product'}
                    </>
                  )}
                </button>
                
                <Link to="/farmer/products" className="btn btn-secondary">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Show Product List
  return (
    <div className="product-management">
      <div className="page-header">
        <h1>🌾 My Products</h1>
        <div className="header-actions">
          <Link to="/farmer/products/add" className="btn btn-primary">
            ➕ Add New Product
          </Link>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All Products ({products.length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'available' ? 'active' : ''}`}
            onClick={() => setFilterStatus('available')}
          >
            Available ({products.filter(p => p.isavailable).length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'out-of-stock' ? 'active' : ''}`}
            onClick={() => setFilterStatus('out-of-stock')}
          >
            Out of Stock ({products.filter(p => p.stockquantity === 0).length})
          </button>
        </div>
      </div>

      <div className="products-grid">
        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <div className="no-products-icon">🌾</div>
            <h3>No products found</h3>
            <p>
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start by adding your first product'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Link to="/farmer/products/add" className="btn btn-primary">
                ➕ Add Your First Product
              </Link>
            )}
          </div>
        ) : (
          filteredProducts.map(product => (
            <div key={product._id} className="product-card">
              <div className="product-image">
                <img 
                  src={product.images[0] || '/placeholder-product.jpg'} 
                  alt={product.name}
                  onError={(e) => e.target.src = '/placeholder-product.jpg'}
                />
                <div className={`availability-badge ${product.isavailable ? 'available' : 'unavailable'}`}>
                  {product.isavailable ? '✅ Available' : '❌ Out of Stock'}
                </div>
              </div>
              
              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-category">{product.category}</p>
                <p className="product-description">{product.description}</p>
                
                <div className="product-details">
                  <div className="detail-item">
                    <span className="label">Price:</span>
                    <span className="value">₹{product.priceperunit}/{product.unit}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Stock:</span>
                    <span className={`value ${product.stockquantity === 0 ? 'out-of-stock' : ''}`}>
                      {product.stockquantity} {product.unit}
                    </span>
                  </div>
                </div>
              </div>

              <div className="product-actions">
                <Link to={`/farmer/products/edit/${product._id}`} className="btn btn-outline">
                  ✏️ Edit
                </Link>
                <button
                  onClick={() => toggleAvailability(product._id)}
                  className={`btn ${product.isavailable ? 'btn-warning' : 'btn-success'}`}
                >
                  {product.isavailable ? '⏸️ Unlist' : '📢 List'}
                </button>
                <button
                  onClick={() => handleDeleteProduct(product)}
                  className="btn btn-danger"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>🗑️ Delete Product</h3>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{productToDelete?.name}</strong>?</p>
              <p className="warning-text">This action cannot be undone and will remove the product from your inventory.</p>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="btn btn-danger"
              >
                🗑️ Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductManagement
