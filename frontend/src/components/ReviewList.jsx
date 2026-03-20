import { useState } from 'react'
import StarRating from './StarRating'
import { reviewAPI } from '../services/reviewAPI'
import LoadingSpinner from './LoadingSpinner'
import Button from './Button'
import './ReviewList.css'

const ReviewList = ({ 
  farmerId, 
  farmerName, 
  showWriteReview = false,
  onWriteReview 
}) => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchReviews = async (page = 1) => {
    try {
      setLoading(true)
      setError('')

      const response = await reviewAPI.getFarmerReviews(farmerId, {
        page,
        limit: 10
      })

      if (response.data.success) {
        if (page === 1) {
          setReviews(response.data.data.reviews)
        } else {
          setReviews(prev => [...prev, ...response.data.data.reviews])
        }
        setPagination(response.data.data.pagination)
      } else {
        throw new Error(response.data.error || 'Failed to load reviews')
      }

    } catch (err) {
      console.error('Error fetching reviews:', err)
      setError('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    if (pagination && currentPage < pagination.pages) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      fetchReviews(nextPage)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const renderReview = (review) => {
    return (
      <div key={review._id} className="review-item">
        <div className="review-header">
          <div className="reviewer-info">
            <span className="reviewer-name">
              {review.reviewer_name || 'Anonymous'}
            </span>
            <span className="review-date">
              {formatDate(review.createdat)}
            </span>
          </div>
          <StarRating
            rating={review.rating}
            readonly={true}
            size="small"
            showValue={false}
          />
        </div>
        
        {review.comment && (
          <div className="review-comment">
            <p>{review.comment}</p>
          </div>
        )}
        
        <div className="review-meta">
          <span className="order-reference">
            Order #{review.ordernumber}
          </span>
        </div>
      </div>
    )
  }

  const renderEmptyState = () => {
    return (
      <div className="reviews-empty">
        <div className="empty-icon">⭐</div>
        <h3>No Reviews Yet</h3>
        <p>Be the first to share your experience with {farmerName}!</p>
        {showWriteReview && onWriteReview && (
          <Button
            variant="primary"
            onClick={onWriteReview}
            size="small"
          >
            Write First Review
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="review-list">
      <div className="reviews-header">
        <h3>Customer Reviews</h3>
        {showWriteReview && onWriteReview && (
          <Button
            variant="outline"
            size="small"
            onClick={onWriteReview}
          >
            Write Review
          </Button>
        )}
      </div>

      {loading && reviews.length === 0 ? (
        <div className="reviews-loading">
          <LoadingSpinner size="medium" text="Loading reviews..." />
        </div>
      ) : error ? (
        <div className="reviews-error">
          <p>{error}</p>
          <Button
            variant="outline"
            size="small"
            onClick={() => fetchReviews(1)}
          >
            Try Again
          </Button>
        </div>
      ) : reviews.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <div className="reviews-container">
            {reviews.map(renderReview)}
          </div>

          {pagination && currentPage < pagination.pages && (
            <div className="reviews-pagination">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                loading={loading}
                size="small"
              >
                {loading ? (
                  <LoadingSpinner size="small" text="" />
                ) : (
                  'Load More Reviews'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ReviewList
