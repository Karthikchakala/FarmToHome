import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import feedbackAPI from '../../services/feedbackAPI'
import LoadingSpinner from '../../components/LoadingSpinner'
import './FeedbackManagement.css'

const AdminFeedbackManagement = () => {
  const { user, isAuthenticated } = useAuth()
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    feedbackType: '',
    category: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setLoading(true)
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...filters
        }
        
        const response = await feedbackAPI.getAllFeedbacks(params)
        if (response.data.success) {
          setFeedbacks(response.data.data.feedbacks)
          setPagination(response.data.data.pagination)
        } else {
          console.error('Failed to fetch feedbacks:', response.data.message)
          setFeedbacks([])
        }
      } catch (error) {
        console.error('Error fetching feedbacks:', error)
        setFeedbacks([])
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchFeedbacks()
    }
  }, [isAuthenticated, pagination.page, filters])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleStatusUpdate = async (feedbackId, newStatus) => {
    try {
      const response = await feedbackAPI.updateFeedbackStatus(feedbackId, newStatus)
      if (response.data.success) {
        // Update local state
        setFeedbacks(prev => 
          prev.map(feedback => 
            feedback._id === feedbackId 
              ? { ...feedback, status: newStatus }
              : feedback
          )
        )
        
        if (selectedFeedback && selectedFeedback._id === feedbackId) {
          setSelectedFeedback(prev => ({ ...prev, status: newStatus }))
        }
        
        alert('Feedback status updated successfully!')
      } else {
        alert('Failed to update status: ' + response.data.message)
      }
    } catch (error) {
      console.error('Error updating feedback status:', error)
      alert('Error updating feedback status. Please try again.')
    }
  }

  const handleDeleteFeedback = async (feedbackId) => {
    if (!confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
      return
    }

    try {
      const response = await feedbackAPI.deleteFeedback(feedbackId)
      if (response.data.success) {
        setFeedbacks(prev => prev.filter(feedback => feedback._id !== feedbackId))
        setShowDetails(false)
        setSelectedFeedback(null)
        alert('Feedback deleted successfully!')
      } else {
        alert('Failed to delete feedback: ' + response.data.message)
      }
    } catch (error) {
      console.error('Error deleting feedback:', error)
      alert('Error deleting feedback. Please try again.')
    }
  }

  const viewFeedbackDetails = async (feedbackId) => {
    try {
      const response = await feedbackAPI.getFeedbackById(feedbackId)
      if (response.data.success) {
        setSelectedFeedback(response.data.data)
        setShowDetails(true)
      } else {
        alert('Failed to fetch feedback details: ' + response.data.message)
      }
    } catch (error) {
      console.error('Error fetching feedback details:', error)
      alert('Error fetching feedback details. Please try again.')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      reviewed: 'info',
      resolved: 'success',
      dismissed: 'error'
    }
    return colors[status] || 'default'
  }

  const getFeedbackTypeColor = (type) => {
    return type === 'customer' ? 'primary' : 'secondary'
  }

  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-feedback-management">
        <div className="auth-message">
          <h2>Please login to access admin panel</h2>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="admin-feedback-management">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="admin-feedback-management">
      <div className="page-header">
        <h1>💬 Feedback Management</h1>
        <p>Manage customer and farmer feedback across the platform</p>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filters.status} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Type:</label>
          <select 
            value={filters.feedbackType} 
            onChange={(e) => handleFilterChange('feedbackType', e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="customer">Customer Feedback</option>
            <option value="farmer">Farmer Feedback</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Category:</label>
          <select 
            value={filters.category} 
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            <option value="general">General</option>
            <option value="quality">Quality</option>
            <option value="delivery">Delivery</option>
            <option value="service">Service</option>
            <option value="packaging">Packaging</option>
          </select>
        </div>
      </div>

      <div className="feedbacks-container">
        {feedbacks.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">💬</div>
            <h3>No Feedback Found</h3>
            <p>There are no feedbacks to display matching your filters.</p>
          </div>
        ) : (
          <div className="feedbacks-list">
            {feedbacks.map(feedback => (
              <div key={feedback._id} className="feedback-card">
                <div className="feedback-header">
                  <div className="feedback-meta">
                    <span className={`feedback-type ${getFeedbackTypeColor(feedback.feedbacktype)}`}>
                      {feedback.feedbacktype === 'customer' ? '👤 Customer' : '🌾 Farmer'}
                    </span>
                    <span className={`status ${getStatusColor(feedback.status)}`}>
                      {feedback.status}
                    </span>
                  </div>
                  <div className="feedback-rating">
                    {renderStars(feedback.rating)}
                    <span className="rating-number">({feedback.rating}/5)</span>
                  </div>
                </div>

                <div className="feedback-content">
                  <div className="feedback-info">
                    <p><strong>From:</strong> {feedback.users?.name || 'N/A'} ({feedback.users?.email})</p>
                    <p><strong>Order:</strong> {feedback.orders?.ordernumber || 'N/A'}</p>
                    <p><strong>Farm:</strong> {feedback.farmers?.farmname || 'N/A'}</p>
                    <p><strong>Category:</strong> {feedback.category || 'general'}</p>
                    <p><strong>Date:</strong> {new Date(feedback.createdat).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="feedback-comment">
                    <p><strong>Comment:</strong></p>
                    <p className="comment-text">{feedback.comment}</p>
                  </div>
                </div>

                <div className="feedback-actions">
                  <button 
                    onClick={() => viewFeedbackDetails(feedback._id)}
                    className="btn btn-primary"
                  >
                    View Details
                  </button>
                  
                  {feedback.status === 'pending' && (
                    <button 
                      onClick={() => handleStatusUpdate(feedback._id, 'reviewed')}
                      className="btn btn-info"
                    >
                      Mark as Reviewed
                    </button>
                  )}
                  
                  {feedback.status === 'reviewed' && (
                    <button 
                      onClick={() => handleStatusUpdate(feedback._id, 'resolved')}
                      className="btn btn-success"
                    >
                      Mark as Resolved
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleStatusUpdate(feedback._id, 'dismissed')}
                    className="btn btn-warning"
                  >
                    Dismiss
                  </button>
                  
                  <button 
                    onClick={() => handleDeleteFeedback(feedback._id)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="pagination">
            <button 
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="btn btn-secondary"
            >
              Previous
            </button>
            
            <span className="page-info">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            
            <button 
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="btn btn-secondary"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Feedback Details Modal */}
      {showDetails && selectedFeedback && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Feedback Details</h2>
              <button 
                onClick={() => setShowDetails(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <h3>User Information</h3>
                <p><strong>Name:</strong> {selectedFeedback.users?.name}</p>
                <p><strong>Email:</strong> {selectedFeedback.users?.email}</p>
                <p><strong>Phone:</strong> {selectedFeedback.users?.phone || 'N/A'}</p>
              </div>
              
              <div className="detail-section">
                <h3>Order Information</h3>
                <p><strong>Order Number:</strong> {selectedFeedback.orders?.ordernumber}</p>
                <p><strong>Order Date:</strong> {new Date(selectedFeedback.orders?.createdat).toLocaleDateString()}</p>
                <p><strong>Total Amount:</strong> ₹{selectedFeedback.orders?.totalamount}</p>
              </div>
              
              <div className="detail-section">
                <h3>Feedback Details</h3>
                <p><strong>Type:</strong> {selectedFeedback.feedbacktype}</p>
                <p><strong>Rating:</strong> {renderStars(selectedFeedback.rating)} ({selectedFeedback.rating}/5)</p>
                <p><strong>Category:</strong> {selectedFeedback.category}</p>
                <p><strong>Status:</strong> {selectedFeedback.status}</p>
                <p><strong>Submitted:</strong> {new Date(selectedFeedback.createdat).toLocaleString()}</p>
              </div>
              
              <div className="detail-section">
                <h3>Comment</h3>
                <p className="comment-full">{selectedFeedback.comment}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminFeedbackManagement
