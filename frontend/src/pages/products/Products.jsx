import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { productAPI } from '../../services/api'
import SEO from '../../components/SEO'
import ProductCard from '../../components/ProductCard'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'
import './Products.css'

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(null)

  // Get filter values from URL
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const sortBy = searchParams.get('sortBy') || 'createdat'
  const sortOrder = searchParams.get('sortOrder') || 'desc'
  const page = parseInt(searchParams.get('page')) || 1

  // Filter states
  const [filters, setFilters] = useState({
    category: category || '',
    search: search || '',
    minPrice: minPrice || '',
    maxPrice: maxPrice || '',
    sortBy: sortBy,
    sortOrder: sortOrder
  })

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Use the API service instead of direct fetch
        const params = {
          page,
          category: filters.category || undefined,
          search: filters.search || undefined,
          minPrice: filters.minPrice || undefined,
          maxPrice: filters.maxPrice || undefined,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder
        }

        const response = await productAPI.getProducts(params)
        
        if (response.data.success) {
          setProducts(response.data.data.products || [])
          setPagination(response.data.data.pagination || null)
        } else {
          setError(response.data.error || 'Failed to load products')
          setProducts([])
          setPagination(null)
        }
      } catch (err) {
        console.error('Error fetching products:', err)
        setError('Failed to connect to server. Please try again later.')
        setProducts([])
        setPagination(null)
      } finally {
        setLoading(false)
      }
    }

    const fetchCategories = async () => {
      try {
        // Use the API service instead of direct fetch
        const response = await productAPI.getCategories()
        if (response.data.success) {
          setCategories(response.data.data.categories || [])
        } else {
          console.log('Failed to load categories:', response.data.error)
          setCategories([])
        }
      } catch (err) {
        console.error('Error fetching categories:', err)
        setCategories([])
      }
    }

    fetchProducts()
    fetchCategories()
  }, [page, filters])

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // Update URL params
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    params.set('page', '1')
    setSearchParams(params)
  }

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    setSearchParams(params)
  }

  const clearFilters = () => {
    setFilters({
      category: '',
      search: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'createdat',
      sortOrder: 'desc'
    })
    setSearchParams({})
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="products">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading fresh products...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO 
        title="Products"
        description="Browse fresh, organic produce from local farmers. Find vegetables, fruits, dairy, and more with convenient delivery options."
        keywords="products, fresh produce, organic vegetables, local farmers, farm fresh, dairy products, sustainable agriculture"
      />
      
      <div className="products">
        <div className="products-header">
          <h1>Fresh Products</h1>
          <p>Discover high-quality produce directly from local farmers</p>
        </div>

        <div className="products-layout">
          {/* Filters Sidebar */}
          <aside className="filters-sidebar">
            <div className="filters-header">
              <h2>Filters</h2>
              <button className="clear-filters" onClick={clearFilters}>
                Clear All
              </button>
            </div>

            {/* Search */}
            <div className="filter-group">
              <label>Search</label>
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="filter-input"
              />
            </div>

            {/* Categories */}
            <div className="filter-group">
              <label>Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category} ({cat.product_count})
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="filter-group">
              <label>Price Range</label>
              <div className="price-range">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="filter-input"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="filter-group">
              <label>Sort By</label>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-')
                  handleFilterChange('sortBy', sortBy)
                  handleFilterChange('sortOrder', sortOrder)
                }}
                className="filter-select"
              >
                <option value="createdat-desc">Newest First</option>
                <option value="createdat-asc">Oldest First</option>
                <option value="priceperunit-asc">Price: Low to High</option>
                <option value="priceperunit-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="products-main">
            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            {products.length === 0 && !error ? (
              <div className="no-products">
                <div className="no-products-icon">🌱</div>
                <h3>Products Coming Soon</h3>
                <p>Our fresh farm products will be available soon. Please check back later!</p>
                <button className="btn btn-outline" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="products-info">
                  <p>Showing {products.length} products</p>
                </div>

                <div className="products-grid">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="pagination">
                    <button
                      className="pagination-btn"
                      disabled={pagination.page === 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      ← Previous
                    </button>

                    <div className="pagination-pages">
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          className={`pagination-page ${pageNum === pagination.page ? 'active' : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button
                      className="pagination-btn"
                      disabled={pagination.page === pagination.pages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </>
  )
}

export default Products
