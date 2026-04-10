import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../hooks/useToast'
import { notificationAPI } from '../../services/notificationAPI'
import SEO from '../../components/SEO'
import LoadingSpinner from '../../components/LoadingSpinner'
import Button from '../../components/Button'
import './Notifications.css'

const Notifications = () => {
  const { user, isAuthenticated } = useAuth()
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [pagination, setPagination] = useState(null)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    type: 'all',
    read: 'all'
  })

  // Load notifications
  const loadNotifications = async () => {
    try {
      setLoading(true)
      
      const params = {
        page: filters.page,
        limit: filters.limit,
        ...(filters.type !== 'all' && { type: filters.type }),
        ...(filters.read !== 'all' && { read: filters.read === 'read' })
      }
      
      const response = await notificationAPI.getNotifications(params)
      
      if (response.data.success) {
        const notificationsData = response.data.data.notifications || []
        console.log('Notifications data received:', notificationsData)
        console.log('Sample notification:', notificationsData[0])
        setNotifications(notificationsData)
        setPagination(response.data.data.pagination || null)
      } else {
        showError(response.data.error || 'Failed to load notifications')
        setNotifications([])
      }
    } catch (err) {
      console.error('Error loading notifications:', err)
      showError('Failed to connect to server. Please try again later.')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await notificationAPI.markAsRead(notificationId)
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        )
        success('Notification marked as read')
      } else {
        showError(response.data.error || 'Failed to mark as read')
      }
    } catch (err) {
      console.error('Error marking as read:', err)
      showError('Failed to mark as read. Please try again.')
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await notificationAPI.markAllAsRead()
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        )
        success('All notifications marked as read')
      } else {
        showError(response.data.error || 'Failed to mark all as read')
      }
    } catch (err) {
      console.error('Error marking all as read:', err)
      showError('Failed to mark all as read. Please try again.')
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const response = await notificationAPI.deleteNotification(notificationId)
      if (response.data.success) {
        setNotifications(prev => 
          prev.filter(notification => notification._id !== notificationId)
        )
        success('Notification deleted')
      } else {
        showError(response.data.error || 'Failed to delete notification')
      }
    } catch (err) {
      console.error('Error deleting notification:', err)
      showError('Failed to delete notification. Please try again.')
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
    if (isAuthenticated) {
      loadNotifications()
    }
  }, [isAuthenticated, filters])

  if (!isAuthenticated) {
    return (
      <div className="notifications-container">
        <div className="auth-message">
          <h2>Please login to view your notifications</h2>
        </div>
      </div>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) {
      console.log('Date string is null or undefined:', dateString)
      return 'Unknown'
    }
    
    try {
      const date = new Date(dateString)
      const now = new Date()
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log('Invalid date created:', dateString, '->', date)
        return 'Invalid Date'
      }
      
      const diffTime = Math.abs(now - date)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) {
        return 'Today'
      } else if (diffDays === 1) {
        return 'Yesterday'
      } else if (diffDays < 7) {
        return `${diffDays} days ago`
      } else {
        return date.toLocaleDateString()
      }
    } catch (error) {
      console.error('Error formatting date:', error, 'Input:', dateString)
      return 'Invalid Date'
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_order':
        return '📋'
      case 'order_cancelled':
        return '❌'
      case 'chat_message':
        return '💬'
      case 'alert':
        return '⚠️'
      case 'success':
        return '✅'
      case 'info':
      default:
        return 'ℹ️'
    }
  }

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case 'new_order':
        return 'Order'
      case 'order_cancelled':
        return 'Cancelled'
      case 'chat_message':
        return 'Message'
      case 'alert':
        return 'Alert'
      case 'success':
        return 'Success'
      case 'info':
      default:
        return 'Info'
    }
  }

  return (
    <>
      <SEO 
        title="Notifications - Farmer Dashboard"
        description="View and manage your notifications"
      />
      
      <div className="notifications-page">
        <div className="notifications-header">
          <h1>🔔 Notifications</h1>
          <p>Stay updated with your farm activities and orders</p>
        </div>

        {/* Filters and Actions */}
        <div className="notifications-controls">
          <div className="filters">
            <select 
              value={filters.type} 
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="new_order">New Orders</option>
              <option value="order_cancelled">Cancelled Orders</option>
              <option value="chat_message">Messages</option>
              <option value="alert">Alerts</option>
              <option value="success">Success</option>
              <option value="info">Info</option>
            </select>
            
            <select 
              value={filters.read} 
              onChange={(e) => handleFilterChange('read', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
          
          <div className="actions">
            <Button 
              variant="outline" 
              size="small"
              onClick={markAllAsRead}
              disabled={notifications.length === 0 || notifications.every(n => n.isRead)}
            >
              Mark All as Read
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="notifications-content">
          {loading ? (
            <LoadingSpinner size="large" text="Loading notifications..." />
          ) : notifications.length > 0 ? (
            <div className="notifications-list">
              {notifications.map(notification => (
                <div 
                  key={notification._id} 
                  className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-header">
                      <h3>{notification.title}</h3>
                      <div className="notification-meta">
                        <span className="notification-type">
                          {getNotificationTypeLabel(notification.type)}
                        </span>
                        <span className="notification-time">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="notification-message">
                      {notification.message}
                    </p>
                    
                    <div className="notification-actions">
                      {!notification.isRead && (
                        <Button 
                          variant="outline" 
                          size="small"
                          onClick={() => markAsRead(notification._id)}
                        >
                          Mark as Read
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="small"
                        onClick={() => deleteNotification(notification._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  {!notification.isRead && (
                    <div className="notification-badge"></div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-notifications">
              <div className="no-notifications-icon">🔔</div>
              <h3>No Notifications</h3>
              <p>
                {filters.type !== 'all' || filters.read !== 'all' 
                  ? 'No notifications match your current filters.'
                  : 'You have no notifications at the moment.'
                }
              </p>
              {(filters.type !== 'all' || filters.read !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={() => setFilters({ page: 1, limit: 10, type: 'all', read: 'all' })}
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

export default Notifications
