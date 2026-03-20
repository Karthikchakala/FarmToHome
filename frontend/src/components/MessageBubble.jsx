import './MessageBubble.css'

const MessageBubble = ({ 
  message, 
  isOwn, 
  senderName, 
  timestamp, 
  isRead,
  showAvatar = true,
  showTimestamp = true
}) => {
  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const getAvatarColor = (name) => {
    const colors = ['#2c7a2c', '#dc3545', '#007bff', '#ffc107', '#17a2b8', '#6f42c1']
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const getInitials = (name) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
      {!isOwn && showAvatar && (
        <div className="message-avatar">
          <div 
            className="avatar-circle"
            style={{ backgroundColor: getAvatarColor(senderName) }}
          >
            {getInitials(senderName)}
          </div>
        </div>
      )}

      <div className="message-content">
        {!isOwn && (
          <div className="sender-name">{senderName}</div>
        )}
        
        <div className="message-text">
          {message}
        </div>

        {showTimestamp && (
          <div className="message-meta">
            <span className="message-time">
              {formatTime(timestamp)}
            </span>
            {isOwn && (
              <span className="read-status">
                {isRead ? (
                  <span className="read-indicator">✓✓</span>
                ) : (
                  <span className="sent-indicator">✓</span>
                )}
              </span>
            )}
          </div>
        )}
      </div>

      {isOwn && showAvatar && (
        <div className="message-avatar">
          <div className="avatar-circle own-avatar">
            <span className="own-avatar-text">ME</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default MessageBubble
