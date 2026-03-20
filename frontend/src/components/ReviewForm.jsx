import { useState } from 'react'
import StarRating from './StarRating'
import { reviewAPI } from '../services/reviewAPI'
import { useToast } from '../hooks/useToast'
import Button from './Button'
import Card from './Card'
import LoadingSpinner from './LoadingSpinner'
import './ReviewForm.css'

const ReviewForm = ({ 
  farmerId, 
  orderId, 
  farmerName, 
  orderNumber,
  onReviewSubmitted,
  onCancel 
}) => {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const { success, error: showError } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    if (!comment.trim()) {
      setError('Please write a review comment')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const reviewData = {
        orderId,
        farmerId,
        rating,
        comment: comment.trim()
      }

      const response = await reviewAPI.addReview(reviewData)

      if (response.data.success) {
        success('Review submitted successfully!')
        
        // Reset form
        setRating(0)
        setComment('')
        
        // Notify parent component
        if (onReviewSubmitted) {
          onReviewSubmitted(response.data.data)
        }
      } else {
        throw new Error(response.data.error || 'Failed to submit review')
      }

    } catch (err) {
      console.error('Review submission error:', err)
      setError(err.response?.data?.error || 'Failed to submit review. Please try again.')
      showError('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
  }

  const getRatingText = () => {
    if (rating === 0) return 'Select a rating'
    if (rating === 1) return 'Poor'
    if (rating === 2) return 'Fair'
    if (rating === 3) return 'Good'
    if (rating === 4) return 'Very Good'
    if (rating === 5) return 'Excellent'
    return ''
  }

  return (
    <Card className="review-form">
      <div className="review-form-header">
        <h3>Review Your Experience</h3>
        <div className="order-info">
          <span className="farmer-name">{farmerName}</span>
          <span className="order-number">Order #{orderNumber}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="review-form-content">
        <div className="rating-section">
          <label className="rating-label">How was your experience?</label>
          <StarRating
            rating={rating}
            onChange={setRating}
            size="large"
            showValue={false}
            interactive={true}
          />
          <div className="rating-text">{getRatingText()}</div>
        </div>

        <div className="comment-section">
          <label htmlFor="comment" className="comment-label">
            Tell us more about your experience
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this farmer's products and service..."
            rows={4}
            className={`comment-textarea ${error && !comment.trim() ? 'error' : ''}`}
            disabled={submitting}
          />
          <div className="comment-hint">
            {comment.length}/500 characters
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-actions">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
          )}
          
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={rating === 0 || !comment.trim() || submitting}
          >
            {submitting ? (
              <LoadingSpinner size="small" text="" />
            ) : (
              'Submit Review'
            )}
          </Button>
        </div>
      </form>

      <div className="review-form-footer">
        <div className="review-guidelines">
          <h4>Review Guidelines</h4>
          <ul>
            <li>Be honest and specific about your experience</li>
            <li>Focus on product quality and service</li>
            <li>Keep comments respectful and constructive</li>
            <li>Reviews are public and help other customers</li>
          </ul>
        </div>
      </div>
    </Card>
  )
}

export default ReviewForm
