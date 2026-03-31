import { useState } from 'react'
import feedbackAPI from '../../services/feedbackAPI'
import './CustomerFeedback.css'

const CustomerFeedback = ({ orderId, farmerId, onFeedbackSubmitted }) => {
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
      const response = await feedbackAPI.createCustomerFeedback(formData)
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
    <div className="customer-feedback">
      <div className="feedback-header">
        <h3>Share Your Feedback</h3>
        <p>Help us improve by sharing your experience</p>
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
            placeholder="Enter your order ID"
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
            <option value="quality">Product Quality</option>
            <option value="delivery">Delivery</option>
            <option value="service">Customer Service</option>
            <option value="packaging">Packaging</option>
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
            placeholder="Please share your experience with this order..."
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

export default CustomerFeedback
