import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../hooks/useToast'
import { farmerAPI } from '../../services/farmerAPI'
import { reviewAPI } from '../../services/reviewAPI'
import SEO from '../../components/SEO'
import LoadingSpinner from '../../components/LoadingSpinner'
import Button from '../../components/Button'
import './ProductReviews.css'

const ProductReviews = () => {
  const { productId } = useParams()
  const { user, isAuthenticated } = useAuth()
  const { success, error: showError } = useToast()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [pagination, setPagination] = useState(null)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    rating: 'all',
    sortBy: 'newest'
  })

  // Load product details
  const loadProductDetails = async () => {
    try {
      const response = await farmerAPI.getProductById(productId)
      if (response.data.success) {
        setProduct(response.data.data)
      } else {
        showError(response.data.error || 'Failed to load product details')
        navigate('/farmer/products')
      }
    } catch (err) {
      console.error('Error loading product details:', err)
      // Don't show error for missing product, just continue
    }
  }

  // Load reviews
  const loadReviews = async () => {
    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
        ...(filters.rating !== 'all' && { rating: filters.rating }),
        sortBy: filters.sortBy
      }
      
      const response = await reviewAPI.getProductReviews(productId, params)
      
      if (response.data.success) {
        setReviews(response.data.data.reviews || [])
        setPagination(response.data.data.pagination || null)
      } else {
        setReviews([])
      }
    } catch (err) {
      console.error('Error loading reviews:', err)
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  // Delete review
  const deleteReview = async (reviewId) => {
    try {
      const response = await reviewAPI.deleteReview(reviewId)
      if (response.data.success) {
        setReviews(prev => prev.filter(review => review._id !== reviewId))
        success('Review deleted successfully')
      } else {
        showError(response.data.error || 'Failed to delete review')
      }
    } catch (err) {
      console.error('Error deleting review:', err)
      showError('Failed to delete review. Please try again.')
    }
  }

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filter changes
    }))
  }

  // Handle pagination
  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }))
  }

  useEffect(() => {
    if (productId) {
      loadProductDetails()
      loadReviews()
    } else {
      setLoading(false)
    }
  }, [productId, filters])

  if (loading) {
    return <LoadingSpinner size="large" text="Loading reviews..." />
  }

  // Calculate rating statistics
  const ratingStats = reviews.length > 0 ? {
    average: (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1),
    distribution: [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: reviews.filter(review => review.rating === rating).length,
      percentage: (reviews.filter(review => review.rating === rating).length / reviews.length) * 100
    }))
  } : { average: '0.0', distribution: [] }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => 
      i < rating ? 'full' : 'empty'
    )
  }

  return (
    <>
      <SEO 
        title={`Reviews for ${product?.name || 'Product'} - Farmer Dashboard`}
        description={`Customer reviews and feedback for ${product?.name || 'Product'}`}
      />
      
      <div className="product-reviews-container">
        {/* Header */}
        <div className="reviews-header">
          <div className="breadcrumb">
            <Link to="/farmer/products">Products</Link>
            <span className="separator">/</span>
            {product && <Link to={`/farmer/products/${productId}`}>{product.name}</Link>}
            {product && <span className="separator">/</span>}
            <span className="current">Reviews</span>
          </div>
          
          {product && (
            <div className="product-info">
              <div className="product-image">
                <img 
                  src={product.images[0] || '/placeholder-product.jpg'} 
                  alt={product.name}
                  onError={(e) => e.target.src = '/placeholder-product.jpg'}
                />
              </div>
              <div className="product-details">
                <h1>{product.name}</h1>
                <p className="product-category">{product.category}</p>
                <p className="product-price">¥{product.priceperunit}/{product.unit}</p>
              </div>
            </div>
          )}
        </div>

        {/* Reviews Overview */}
        <div className="reviews-overview">
          <h2>Customer Reviews Overview</h2>
          <div className="overview-content">
            <div className="rating-summary">
              <div className="average-rating">
                <span className="rating-score">{ratingStats.average}</span>
                <div className="rating-stars">
                  {renderStars(Math.round(ratingStats.average)).map((type, i) => (
                    <span key={i} className={`star ${type}`}>{'\u2b50'}</span>
                  ))}
                </div>
                <span className="total-reviews">{reviews.length} reviews</span>
              </div>
              
              {ratingStats.distribution.length > 0 && (
                <div className="rating-distribution">
                  {ratingStats.distribution.map(({ rating, count, percentage }) => (
                    <div key={rating} className="distribution-row">
                      <span className="rating-label">{rating} stars</span>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="rating-count">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="reviews-filters">
          <div className="filter-group">
            <label>Rating:</label>
            <select 
              value={filters.rating} 
              onChange={(e) => handleFilterChange('rating', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Sort by:</label>
            <select 
              value={filters.sortBy} 
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="filter-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        <div className="reviews-content">
          {reviews.length > 0 ? (
            <div className="reviews-list">
              {reviews.map(review => (
                <div key={review._id} className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <span className="reviewer-name">
                        {review.customer?.name || 'Anonymous Customer'}
                      </span>
                      <span className="review-date">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <div className="review-rating">
                      {renderStars(review.rating).map((type, i) => (
                        <span key={i} className={`star ${type}`}>{type === 'full' ? '\u2b50' : '\u2606'}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="review-content">
                    <p className="review-comment">{review.comment}</p>
                  </div>
                  
                  <div className="review-actions">
                    <Button 
                      variant="outline" 
                      size="small"
                      onClick={() => deleteReview(review._id)}
                    >
                      Delete Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-reviews">
              <div className="no-reviews-icon">No Reviews Yet</div>
              <h3>No Reviews Yet</h3>
              <p>
                {filters.rating !== 'all' || filters.sortBy !== 'newest' 
                  ? 'No reviews match your current filters.'
                  : 'This product hasn\'t received any customer reviews yet.'
                }
              </p>
              {(filters.rating !== 'all' || filters.sortBy !== 'newest') && (
                <Button 
                  variant="outline"
                  onClick={() => setFilters({ page: 1, limit: 10, rating: 'all', sortBy: 'newest' })}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <Button 
              variant="outline" 
              size="small"
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page === 1}
            >
              Previous
            </Button>
            
            <span className="page-info">
              Page {filters.page} of {pagination.totalPages}
            </span>
            
            <Button 
              variant="outline" 
              size="small"
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

export default ProductReviews
