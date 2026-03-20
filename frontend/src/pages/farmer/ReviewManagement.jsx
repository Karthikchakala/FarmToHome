import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import './ReviewManagement.css'

const ReviewManagement = () => {
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState([])
  const [filterRating, setFilterRating] = useState('all')
  const [selectedReview, setSelectedReview] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [responseText, setResponseText] = useState('')

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API call
        // For now, show no data state
        setReviews([])
      } catch (error) {
        console.error('Error fetching reviews:', error)
        setReviews([])
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchReviews()
    }
  }, [isAuthenticated])

  const filteredReviews = reviews.filter(review => {
    if (filterRating === 'all') return true
    return review.rating === parseInt(filterRating)
  })

  const handleReviewClick = (review) => {
    setSelectedReview(review)
    setShowModal(true)
    setResponseText(review.response || '')
  }

  const handleResponseSubmit = async () => {
    try {
      // TODO: Replace with actual API call
      console.log('Submitting response for review:', selectedReview._id, responseText)
      setShowModal(false)
      setResponseText('')
    } catch (error) {
      console.error('Error submitting response:', error)
    }
  }

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach(review => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1
    })
    return distribution
  }

  const getAverageRating = () => {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return (sum / reviews.length).toFixed(1)
  }

  if (!isAuthenticated) {
    return (
      <div className="review-management">
        <div className="auth-message">
          <h2>Please login to manage your reviews</h2>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="review-management">
        <LoadingSpinner />
      </div>
    )
  }

  const ratingDistribution = getRatingDistribution()
  const averageRating = getAverageRating()

  return (
    <div className="review-management">
      <div className="page-header">
        <h1>⭐ Review Management</h1>
        <p>Manage customer reviews and respond to feedback</p>
      </div>

      <div className="review-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{averageRating}</h3>
            <p>Average Rating</p>
          </div>
          <div className="stat-card">
            <h3>{reviews.length}</h3>
            <p>Total Reviews</p>
          </div>
          <div className="stat-card">
            <h3>{ratingDistribution[5]}</h3>
            <p>5-Star Reviews</p>
          </div>
        </div>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Filter by Rating:</label>
          <select 
            value={filterRating} 
            onChange={(e) => setFilterRating(e.target.value)}
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
      </div>

      <div className="reviews-container">
        {filteredReviews.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">⭐</div>
            <h3>No Reviews Found</h3>
            <p>There are no customer reviews to display. Start receiving reviews from customers to see them here.</p>
          </div>
        ) : (
          <div className="reviews-grid">
            {filteredReviews.map(review => (
              <div key={review._id} className="review-card">
                <div className="review-header">
                  <div className="rating">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < review.rating ? 'star filled' : 'star'}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="date">
                    {new Date(review.reviewDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="review-content">
                  <h4>{review.title || 'No Title'}</h4>
                  <p>{review.comment || 'No comment provided'}</p>
                </div>
                <div className="review-customer">
                  <p><strong>Customer:</strong> {review.customer?.name || 'Anonymous'}</p>
                  <p><strong>Product:</strong> {review.product?.name || 'N/A'}</p>
                </div>
                <div className="review-actions">
                  <button 
                    onClick={() => handleReviewClick(review)}
                    className="btn btn-outline"
                  >
                    {review.response ? 'View Response' : 'Respond'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Response Modal */}
      {showModal && selectedReview && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Respond to Review</h2>
              <button 
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="review-details">
                <div className="review-rating">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < selectedReview.rating ? 'star filled' : 'star'}>
                      ★
                    </span>
                  ))}
                </div>
                <h4>{selectedReview.title || 'No Title'}</h4>
                <p>{selectedReview.comment || 'No comment provided'}</p>
                <p><strong>Customer:</strong> {selectedReview.customer?.name || 'Anonymous'}</p>
                <p><strong>Product:</strong> {selectedReview.product?.name || 'N/A'}</p>
                <p><strong>Date:</strong> {new Date(selectedReview.reviewDate).toLocaleDateString()}</p>
              </div>
              <div className="response-section">
                <h3>Your Response</h3>
                {selectedReview.response ? (
                  <div className="existing-response">
                    <p>{selectedReview.response}</p>
                  </div>
                ) : (
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Write your response to this review..."
                    className="response-textarea"
                    rows="4"
                  />
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              {!selectedReview.response && (
                <button 
                  className="btn btn-primary"
                  onClick={handleResponseSubmit}
                  disabled={!responseText.trim()}
                >
                  Submit Response
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReviewManagement
