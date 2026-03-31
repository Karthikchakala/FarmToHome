import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { feedbackAPI } from '../services/api'
import LoadingSpinner from './LoadingSpinner'
import './FeedbackForm.css'

const FeedbackForm = ({ onSuccess, onCancel }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    category: 'product',
    subcategory: '',
    subject: '',
    description: '',
    priority: 'medium',
    orderId: ''
  })

  const [orders, setOrders] = useState([])

  const complaintCategories = {
    product: {
      label: 'Product Related',
      subcategories: [
        { value: 'quality', label: 'Quality Issues' },
        { value: 'freshness', label: 'Freshness Problems' },
        { value: 'packaging', label: 'Packaging Issues' },
        { value: 'wrong_item', label: 'Wrong Item Delivered' },
        { value: 'short_quantity', label: 'Short Quantity' },
        { value: 'expired', label: 'Expired Product' },
        { value: 'damage', label: 'Damaged Product' }
      ]
    },
    farmer: {
      label: 'Farmer Related',
      subcategories: [
        { value: 'behavior', label: 'Farmer Behavior' },
        { value: 'delivery_delay', label: 'Delivery Delay' },
        { value: 'communication', label: 'Communication Issues' },
        { value: 'service_quality', label: 'Service Quality' },
        { value: 'pricing', label: 'Pricing Issues' }
      ]
    }
  }

  useEffect(() => {
    if (user?.role === 'customer') {
      fetchCustomerData()
    }
  }, [user])

  const fetchCustomerData = async () => {
    try {
      // Fetch customer's orders
      const ordersResponse = await feedbackAPI.getCustomerOrders()
      if (ordersResponse.data.success) {
        setOrders(ordersResponse.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching customer data:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    console.log('Input changed:', { name, value, target: e.target })
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value,
        subcategory: name === 'category' ? '' : prev.subcategory
      }
      console.log('New form data:', newData)
      return newData
    })
  }

  const handleSubcategoryChange = (e) => {
    const value = e.target.value
    console.log('Subcategory changed:', value)
    setFormData(prev => {
      const newData = {
        ...prev,
        subcategory: value
      }
      console.log('New form data after subcategory change:', newData)
      return newData
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('Form submission started')
    console.log('Current form data:', formData)
    
    // Basic validation
    if (!formData.category) {
      console.log('Validation failed: Category is required')
      setError('Please select a category')
      return
    }
    if (!formData.subcategory) {
      console.log('Validation failed: Subcategory is required')
      setError('Please select a subcategory')
      return
    }
    if (!formData.subject) {
      console.log('Validation failed: Subject is required')
      setError('Please enter a subject')
      return
    }
    if (!formData.description) {
      console.log('Validation failed: Description is required')
      setError('Please enter a description')
      return
    }
    
    console.log('Form validation passed')
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      console.log('Submitting feedback to API...')
      const response = await feedbackAPI.submitFeedback(formData)
      console.log('API response:', response)
      
      if (response.data.success) {
        console.log('Feedback submitted successfully')
        setSuccess('Feedback submitted successfully! We will get back to you soon.')
        setFormData({
          category: 'product',
          subcategory: '',
          subject: '',
          description: '',
          priority: 'medium',
          orderId: ''
        })
        
        if (onSuccess) {
          onSuccess(response.data.data)
        }
      } else {
        console.log('API returned error:', response.data.error)
        setError(response.data.error || 'Failed to submit feedback')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setError('Failed to submit feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getCurrentCategories = () => {
    console.log('complaintCategories:', complaintCategories)
    return complaintCategories
  }

  const getCurrentSubcategories = () => {
    const categories = getCurrentCategories()
    console.log('Categories object:', categories)
    console.log('Looking for category:', formData.category)
    console.log('Category exists:', !!categories[formData.category])
    const subcategories = categories[formData.category]?.subcategories || []
    console.log('Current category:', formData.category)
    console.log('Available subcategories:', subcategories)
    return subcategories
  }

  return (
    <div className="feedback-form">
      <div className="feedback-header">
        <h2> Submit Feedback</h2>
        <p>
          Help us improve your experience by reporting issues with products or farmer services.
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="feedback-form-container">
        {/* Category Selection */}
        <div className="form-group">
          <label className="form-label">Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="form-select"
            required
          >
            {Object.entries(getCurrentCategories()).map(([key, category]) => (
              <option key={key} value={key}>{category.label}</option>
            ))}
          </select>
        </div>

        {/* Subcategory Selection */}
        <div className="form-group">
          <label className="form-label">Subcategory *</label>
          <select
            name="subcategory"
            value={formData.subcategory}
            onChange={handleSubcategoryChange}
            className="form-select"
            required
            key={`subcategory-${formData.category}`}
          >
            <option value="">Select subcategory</option>
            {getCurrentSubcategories().map(subcategory => {
              console.log('Rendering subcategory option:', subcategory)
              return (
                <option key={subcategory.value} value={subcategory.value}>
                  {subcategory.label}
                </option>
              )
            })}
          </select>
          <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
            Debug: Current subcategory value: "{formData.subcategory}"
          </div>
          <div style={{fontSize: '12px', color: '#666', marginTop: '2px'}}>
            Debug: Available options count: {getCurrentSubcategories().length}
          </div>
          <div style={{fontSize: '12px', color: '#666', marginTop: '2px'}}>
            Debug: Form data: {JSON.stringify(formData)}
          </div>
        </div>

        {/* Subject */}
        <div className="form-group">
          <label className="form-label">Subject *</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Brief description of the issue"
            required
            maxLength={200}
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="form-textarea"
            placeholder="Please provide detailed information about the issue..."
            required
            rows={6}
            maxLength={2000}
          />
          <div className="character-count">
            {formData.description.length}/2000 characters
          </div>
        </div>

        {/* Priority */}
        <div className="form-group">
          <label className="form-label">Priority *</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            className="form-select"
            required
          >
            <option value="low">Low - Minor issue</option>
            <option value="medium">Medium - Affects experience</option>
            <option value="high">High - Urgent attention needed</option>
            <option value="critical">Critical - System breaking issue</option>
          </select>
        </div>

        {/* Related Order Selection */}
        {(formData.category === 'product' || formData.category === 'farmer') && (
          <div className="form-group">
            <label className="form-label">Related Order (if applicable)</label>
            <select
              name="orderId"
              value={formData.orderId}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="">Select order (optional)</option>
              {orders.map(order => (
                <option key={order._id} value={order._id}>
                  Order #{order.ordernumber} - {formatDate(order.createdat)} - ${order.totalamount} - {order.status}
                </option>
              ))}
            </select>
            {orders.length === 0 && (
              <p className="no-orders-hint">No orders found. You can still submit feedback without selecting an order.</p>
            )}
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" />
                Submitting...
              </>
            ) : (
              <>
                 Submit Feedback
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default FeedbackForm
