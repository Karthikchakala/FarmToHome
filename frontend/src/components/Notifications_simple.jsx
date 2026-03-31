import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './Notifications.css'

const Notifications = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    // Mock data for now
    setNotifications([
      {
        _id: '1',
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'system_update',
        priority: 'medium',
        isread: false,
        createdat: new Date().toISOString()
      }
    ])
    setUnreadCount(1)
  }, [])

  const getNotificationIcon = (type) => {
    const icons = {
      low_stock: '⚠️',
      order_confirmation: '✅',
      farmer_approval: '🎉',
      new_order: '📦',
      product_approved: '✅',
      product_rejected: '❌',
      order_update: '📋',
      payment_received: '💰',
      review_received: '⭐',
      subscription_created: '🔄',
      subscription_cancelled: '❌',
      system_update: '🔔'
    }
    return icons[type] || '🔔'
  }

  return (
    <div className="notifications-container" ref={dropdownRef}>
      <button 
        className="notifications-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="notification-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notifications</h3>
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <span className="no-notifications-icon">🔔</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification._id}
                  className={`notification-item ${!notification.isread ? 'unread' : ''}`}
                >
                  <div className="notification-content">
                    <div className="notification-header">
                      <span className="notification-icon">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <span className="notification-time">Just now</span>
                    </div>
                    <div className="notification-body">
                      <h4 className="notification-title">{notification.title}</h4>
                      <p className="notification-message">{notification.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Notifications
