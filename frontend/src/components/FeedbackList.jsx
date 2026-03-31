import { useState, useEffect } from 'react'
import { feedbackAPI } from '../services/api'
import LoadingSpinner from './LoadingSpinner'
import FeedbackDetails from './FeedbackDetails'
import './FeedbackList.css'

const FeedbackList = ({ adminView = false }) => {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    priority: '',
    page: 1
  })
  const [pagination, setPagination] = useState(null)
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    fetchFeedbacks()
  }, [filters])

  const fetchFeedbacks = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = adminView 
        ? await feedbackAPI.getAllFeedback(filters)
        : await feedbackAPI.getUserFeedback(filters)
      
      if (response.data.success) {
        setFeedbacks(response.data.data.feedbacks || [])
        setPagination(response.data.data.pagination || null)
      } else {
        setError(response.data.error || 'Failed to fetch feedback')
      }
    } catch (error) {
      console.error('Error fetching feedback:', error)
      setError('Failed to fetch feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1
    }))
  }

  const handleStatusUpdate = async (feedbackId, newStatus) => {
    try {
      const response = await feedbackAPI.updateFeedbackStatus(feedbackId, { status: newStatus })
      if (response.data.success) {
        fetchFeedbacks()
        if (selectedFeedback?._id === feedbackId) {
          setSelectedFeedback(prev => ({ ...prev, status: newStatus }))
        }
      }
    } catch (error) {
      console.error('Error updating feedback status:', error)
    }
  }

  const viewDetails = (feedback) => {
    setSelectedFeedback(feedback)
    setShowDetails(true)
  }

  const closeDetails = () => {
    setShowDetails(false)
    setSelectedFeedback(null)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: '#ffc107', label: 'Pending' },
      in_progress: { color: '#17a2b8', label: 'In Progress' },
      resolved: { color: '#28a745', label: 'Resolved' },
      rejected: { color: '#dc3545', label: 'Rejected' }
    }
    
    const config = statusConfig[status] || statusConfig.pending
    return (
      <span 
        className="status-badge" 
        style={{ backgroundColor: config.color }}
      >
        {config.label}
      </span>
    )
  }

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { color: '#6c757d', label: 'Low' },
      medium: { color: '#ffc107', label: 'Medium' },
      high: { color: '#fd7e14', label: 'High' },
      critical: { color: '#dc3545', label: 'Critical' }
    }
    
    const config = priorityConfig[priority] || priorityConfig.medium
    return (
      <span 
        className="priority-badge" 
        style={{ backgroundColor: config.color }}
      >
        {config.label}
      </span>
    )
  }

  const getCategoryIcon = (category) => {
    const icons = {
      product: '🥬',
      farmer: '👨‍🌾',
      technical: '🔧',
      service: '🛎️',
      billing: '💳',
      other: '📝'
    }
    return icons[category] || '📝'
  }

  if (loading) {
    return <LoadingSpinner size="large" text="Loading feedback..." />
  }

  return (
    <div className="feedback-list">
      <div className="feedback-list-header">
        <h2>
          {adminView ? '📊 All Feedback' : '📝 My Feedback'}
        </h2>
        <p>
          {adminView 
            ? 'Manage and respond to customer feedback and complaints'
            : 'Track your submitted feedback and complaints'
          }
        </p>
      </div>

      {/* Filters */}
      <div className="feedback-filters">
        <div className="filter-group">
          <label>Category:</label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="product">Product Related</option>
            <option value="farmer">Farmer Related</option>
            <option value="technical">Technical Issues</option>
            <option value="service">Service Issues</option>
            <option value="billing">Billing Issues</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Priority:</label>
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Feedback List */}
      {feedbacks.length === 0 ? (
        <div className="empty-feedback">
          <div className="empty-icon">📝</div>
          <h3>No feedback found</h3>
          <p>
            {adminView 
              ? 'No feedback has been submitted yet.'
              : 'You haven\'t submitted any feedback yet.'
            }
          </p>
        </div>
      ) : (
        <div className="feedback-items">
          {feedbacks.map(feedback => (
            <div key={feedback._id} className="feedback-item">
              <div className="feedback-header">
                <div className="feedback-info">
                  <div className="feedback-title">
                    <span className="category-icon">
                      {getCategoryIcon(feedback.category)}
                    </span>
                    <h3>{feedback.subject}</h3>
                  </div>
                  <div className="feedback-meta">
                    <span className="feedback-id">#{feedback._id.slice(-8)}</span>
                    <span className="feedback-date">
                      {new Date(feedback.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                
                <div className="feedback-badges">
                  {getPriorityBadge(feedback.priority)}
                  {getStatusBadge(feedback.status)}
                </div>
              </div>

              <div className="feedback-content">
                <p className="feedback-description">
                  {feedback.description.length > 150 
                    ? feedback.description.substring(0, 150) + '...'
                    : feedback.description
                  }
                </p>
                
                {feedback.attachments && feedback.attachments.length > 0 && (
                  <div className="feedback-attachments">
                    <span className="attachment-icon">📎</span>
                    <span>{feedback.attachments.length} attachment(s)</span>
                  </div>
                )}
              </div>

              <div className="feedback-actions">
                <button
                  onClick={() => viewDetails(feedback)}
                  className="btn btn-outline btn-small"
                >
                  View Details
                </button>
                
                {adminView && feedback.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(feedback._id, 'in_progress')}
                      className="btn btn-primary btn-small"
                    >
                      Start Working
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(feedback._id, 'resolved')}
                      className="btn btn-success btn-small"
                    >
                      Mark Resolved
                    </button>
                  </>
                )}
                
                {adminView && feedback.status === 'in_progress' && (
                  <button
                    onClick={() => handleStatusUpdate(feedback._id, 'resolved')}
                    className="btn btn-success btn-small"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {/* Feedback Details Modal */}
      {showDetails && selectedFeedback && (
        <FeedbackDetails
          feedback={selectedFeedback}
          onClose={closeDetails}
          adminView={adminView}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  )
}

export default FeedbackList
