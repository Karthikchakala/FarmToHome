import { useState } from 'react'
import feedbackAPI from '../../services/feedbackAPI'
import './FarmerFeedback.css'

const FarmerFeedback = ({ orderId, onFeedbackSubmitted }) => {
  const [formData, setFormData] = useState({
    orderId: orderId || '',
    rating: 5,
    comment: '',
    category: 'general'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await feedbackAPI.createFarmerFeedback(formData)
      if (response.data.success) {
        setSuccess('Thank you for your feedback! Your review has been submitted successfully.')
        setFormData({
          orderId: orderId || '',
          rating: 5,
          comment: '',
          category: 'general'
        })
        
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted(response.data.data)
        }
      } else {
        setError(response.data.message || 'Failed to submit feedback')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setError('Failed to submit feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star ${star <= rating ? 'active' : ''}`}
            onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
          >
            ★
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="farmer-feedback">
      <div className="feedback-header">
        <h3>Share Your Experience</h3>
        <p>Help us improve by sharing your feedback about this order</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="feedback-form">
        <div className="form-group">
          <label htmlFor="orderId">Order ID *</label>
          <input
            type="text"
            id="orderId"
            name="orderId"
            value={formData.orderId}
            onChange={handleChange}
            required
            placeholder="Enter order ID"
          />
        </div>

        <div className="form-group">
          <label>Rating *</label>
          {renderStars(formData.rating)}
          <span className="rating-text">({formData.rating} out of 5 stars)</span>
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="general">General</option>
            <option value="customer">Customer Experience</option>
            <option value="delivery">Delivery Process</option>
            <option value="payment">Payment</option>
            <option value="platform">Platform Experience</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="comment">Your Feedback *</label>
          <textarea
            id="comment"
            name="comment"
            value={formData.comment}
            onChange={handleChange}
            required
            rows={4}
            placeholder="Please share your experience with this order and customer..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="submit-btn"
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  )
}

export default FarmerFeedback
