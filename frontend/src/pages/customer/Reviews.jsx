import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { reviewAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import SEO from '../../components/SEO'
import Card from '../../components/Card'
import LoadingSpinner from '../../components/LoadingSpinner'
import Button from '../../components/Button'
import StarRating from '../../components/StarRating'
import './Reviews.css'

const CustomerReviews = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddReview, setShowAddReview] = useState(false)
  const [newReview, setNewReview] = useState({
    productId: '',
    productName: '',
    rating: 5,
    comment: ''
  })
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    try {
      // Fetch real reviews from backend
      const response = await reviewAPI.getUserReviews()
      if (response.data.success) {
        setReviews(response.data.data.reviews || [])
      } else {
        console.log('Failed to load reviews:', response.data.error)
        setReviews([])
      }
      setLoading(false)
    } catch (err) {
      console.error('Failed to load reviews:', err)
      setReviews([])
      setLoading(false)
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!newReview.productName || !newReview.comment) {
      setError('Please fill in all fields')
      return
    }

    try {
      // Submit review to backend
      const response = await reviewAPI.createReview(newReview)
      if (response.data.success) {
        loadReviews() // Refresh reviews list
        setNewReview({ productId: '', productName: '', rating: 5, comment: '' })
        setShowAddReview(false)
      } else {
        setError(response.data.error || 'Failed to submit review')
      }
    } catch (err) {
      console.error('Failed to submit review:', err)
      setError('Failed to connect to server. Please try again later.')
    }
  }

  if (loading) {
    return (
      <div className="customer-reviews">
        <div className="reviews-header">
          <h1>My Reviews</h1>
        </div>
        <LoadingSpinner size="large" text="Loading reviews..." />
      </div>
    )
  }

  return (
    <>
      <SEO 
        title="My Reviews"
        description="View and manage your product reviews and ratings."
      />
      
      <div className="customer-reviews">
        <div className="reviews-header">
          <h1>My Reviews</h1>
          <Button 
            onClick={() => setShowAddReview(!showAddReview)}
            variant="primary"
          >
            ➕ Add Review
          </Button>
        </div>

        {showAddReview && (
          <Card className="add-review-card">
            <h3>Add New Review</h3>
            <form onSubmit={handleSubmitReview} className="review-form">
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  value={newReview.productName}
                  onChange={(e) => setNewReview({...newReview, productName: e.target.value})}
                  placeholder="Enter product name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Rating</label>
                <StarRating
                  rating={newReview.rating}
                  onRatingChange={(rating) => setNewReview({...newReview, rating})}
                  interactive={true}
                />
              </div>
              
              <div className="form-group">
                <label>Review</label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                  placeholder="Share your experience with this product..."
                  rows={4}
                  required
                />
              </div>
              
              <div className="form-actions">
                <Button type="submit" variant="primary">
                  Submit Review
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowAddReview(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {error && (
          <Card className="error-card">
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          </Card>
        )}

        {reviews.length === 0 ? (
          <Card className="empty-reviews">
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No Reviews Yet</h3>
              <p>You haven't written any product reviews yet. Start sharing your experience!</p>
              <Button onClick={() => navigate('/products')} variant="primary">
                Browse Products
              </Button>
            </div>
          </Card>
        ) : (
          <div className="reviews-list">
            {reviews.map((review) => (
              <Card key={review._id} className="review-card">
                <div className="review-header">
                  <div className="product-info">
                    <span className="product-icon">{review.product.image}</span>
                    <div>
                      <h4>{review.product.name}</h4>
                      <p className="review-date">{review.createdAt}</p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
                
                <div className="review-content">
                  <p>{review.comment}</p>
                </div>
                
                <div className="review-footer">
                  <span className="helpful-count">👍 {review.helpful} helpful</span>
                  <Button variant="outline" size="small">
                    Edit Review
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default CustomerReviews
