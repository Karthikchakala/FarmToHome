import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { adminAPI } from '../../services/adminAPI'
import LoadingSpinner from '../../components/LoadingSpinner'
import './ProductManagement.css'

const AdminProductManagement = () => {
  const { user, isAuthenticated } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await adminAPI.getAllProducts()
        if (response.data.success) {
          setProducts(response.data.data || [])
        } else {
          console.error('Failed to fetch products:', response.data.message)
          setProducts([])
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchProducts()
    }
  }, [isAuthenticated])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.farmer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.farmer?.farmname?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'available' && product.isavailable) ||
                         (filterStatus === 'out-of-stock' && !product.isavailable)
    return matchesSearch && matchesFilter
  })

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    try {
      const response = await adminAPI.deleteProduct(productId)
      if (response.data.success) {
        // Refresh products list
        const productsResponse = await adminAPI.getAllProducts()
        if (productsResponse.data.success) {
          setProducts(productsResponse.data.data || [])
        }
        alert('Product deleted successfully!')
      } else {
        alert('Failed to delete product: ' + response.data.message)
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error deleting product. Please try again.')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-product-management">
        <div className="auth-message">
          <h2>Please login to access admin panel</h2>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="admin-product-management">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="admin-product-management">
      <div className="page-header">
        <h1>🥬 Product Management</h1>
        <p>Manage all products and listings across the platform</p>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Search Products:</label>
          <input
            type="text"
            placeholder="Search by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <label>Filter by Status:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Products</option>
            <option value="available">Available</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>
      </div>

      <div className="products-container">
        {filteredProducts.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">🥬</div>
            <h3>No Products Found</h3>
            <p>There are no products to display. Products will appear here once farmers start listing their items.</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => (
              <div key={product._id} className="product-card">
                <div className="product-header">
                  <h3>{product.name || 'Unknown Product'}</h3>
                  <span className={`status ${product.isavailable ? 'available' : 'out-of-stock'}`}>
                    {product.isavailable ? 'Available' : 'Out of Stock'}
                  </span>
                </div>
                <div className="product-info">
                  <p><strong>Farmer:</strong> {product.farmer?.name || 'N/A'}</p>
                  <p><strong>Farm:</strong> {product.farmer?.farmname || 'N/A'}</p>
                  <p><strong>Email:</strong> {product.farmer?.email || 'N/A'}</p>
                  <p><strong>Category:</strong> {product.category || 'N/A'}</p>
                  <p><strong>Price:</strong> ₹{product.priceperunit || 0}/{product.unit || 'unit'}</p>
                  <p><strong>Stock:</strong> {product.stockquantity || 0} {product.unit || 'units'}</p>
                  <p><strong>Min Order:</strong> {product.minorderquantity || 1} {product.unit || 'units'}</p>
                  <p><strong>Added:</strong> {product.createdat ? new Date(product.createdat).toLocaleDateString() : 'N/A'}</p>
                  {product.ratingaverage > 0 && (
                    <p><strong>Rating:</strong> ⭐ {product.ratingaverage.toFixed(1)} ({product.ratingcount} reviews)</p>
                  )}
                  {product.isfeatured && (
                    <p><strong>Featured:</strong> ⭐ Yes</p>
                  )}
                </div>
                <div className="product-description">
                  <p><strong>Description:</strong> {product.description || 'No description available'}</p>
                </div>
                <div className="product-actions">
                  <button className="btn btn-outline">View Details</button>
                  <button className="btn btn-danger" onClick={() => handleDeleteProduct(product._id)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminProductManagement
