import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import MessageBubble from './MessageBubble'
import './ChatWindow.css'

const ChatWindow = ({ 
  currentUserId, 
  otherUserId, 
  otherUserName, 
  otherUserRole,
  orderId,
  onClose 
}) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Initialize Socket.io connection
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('Authentication required')
      setLoading(false)
      return
    }

    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: {
        token: token
      }
    })

    newSocket.on('connect', () => {
      setIsConnected(true)
      setError(null)
      
      // Join chat room
      const roomName = [currentUserId, otherUserId].sort().join('_')
      newSocket.emit('joinChatRoom', { otherUserId })
      
      console.log('Connected to chat server')
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
      console.log('Disconnected from chat server')
    })

    newSocket.on('connect_error', (error) => {
      setError('Connection failed')
      setLoading(false)
      console.error('Socket connection error:', error)
    })

    // Listen for new messages
    newSocket.on('newMessage', (messageData) => {
      setMessages(prev => [...prev, messageData])
    })

    // Listen for typing indicators
    newSocket.on('userTyping', ({ isTyping }) => {
      setOtherUserTyping(isTyping)
    })

    // Listen for message read receipts
    newSocket.on('messageSeenReceipt', ({ messageId }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, is_read: true } : msg
      ))
    })

    // Listen for message deletions
    newSocket.on('messageDeleted', ({ messageId }) => {
      setMessages(prev => prev.filter(msg => msg._id !== messageId))
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [currentUserId, otherUserId])

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `/api/messages?userId=${currentUserId}&receiverId=${otherUserId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        )

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setMessages(data.data.messages)
          } else {
            setError(data.error || 'Failed to load messages')
          }
        } else {
          setError('Failed to load messages')
        }
      } catch (err) {
        console.error('Error fetching messages:', err)
        setError('Failed to load messages')
      } finally {
        setLoading(false)
      }
    }

    if (currentUserId && otherUserId) {
      fetchMessages()
    }
  }, [currentUserId, otherUserId])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle typing indicators
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isTyping && socket) {
        socket.emit('typing', { otherUserId, isTyping: false })
        setIsTyping(false)
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [isTyping, socket, otherUserId])

  const handleSendMessage = (e) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !socket || !isConnected) {
      return
    }

    const messageData = {
      receiverId: otherUserId,
      message: newMessage.trim(),
      orderId: orderId || null
    }

    // Send message via Socket.io (for real-time)
    socket.emit('sendMessage', messageData)

    // Also send via API for persistence
    fetch('/api/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(messageData)
    }).catch(err => {
      console.error('Error sending message:', err)
      setError('Failed to send message')
    })

    setNewMessage('')
    inputRef.current?.focus()
  }

  const handleTyping = (e) => {
    setNewMessage(e.target.value)
    
    if (!isTyping && socket && e.target.value.length > 0) {
      setIsTyping(true)
      socket.emit('typing', { otherUserId, isTyping: true })
    }
  }

  const markAsRead = () => {
    if (socket && messages.some(msg => !msg.is_read && msg.receiver_id === currentUserId)) {
      const unreadMessage = messages.find(msg => !msg.is_read && msg.receiver_id === currentUserId)
      socket.emit('markAsRead', { 
        messageId: unreadMessage ? unreadMessage._id : null,
        otherUserId 
      })
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } else {
      return date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  if (loading) {
    return (
      <div className="chat-window">
        <div className="chat-header">
          <div className="chat-info">
            <h3>Loading chat...</h3>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="chat-messages">
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Loading messages...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="chat-window">
        <div className="chat-header">
          <div className="chat-info">
            <h3>Chat Error</h3>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="chat-messages">
          <div className="error-indicator">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-info">
          <div className="user-avatar">
            <span className="avatar-circle">
              {otherUserName?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="user-details">
            <h3>{otherUserName}</h3>
            <span className="user-role">{otherUserRole}</span>
            <span className={`connection-status ${isConnected ? 'online' : 'offline'}`}>
              {isConnected ? '● Online' : '● Offline'}
            </span>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="chat-messages" onClick={markAsRead}>
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble
                key={message._id}
                message={message.message}
                isOwn={message.sender_id === currentUserId}
                senderName={message.sender_name || 'Unknown'}
                timestamp={message.created_at}
                isRead={message.is_read}
              />
            ))}
            
            {otherUserTyping && (
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input" onSubmit={handleSendMessage}>
        <div className="input-container">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            disabled={!isConnected}
            maxLength={500}
          />
          <button 
            type="submit" 
            className="send-btn"
            disabled={!newMessage.trim() || !isConnected}
          >
            <span className="send-icon">➤</span>
          </button>
        </div>
        {!isConnected && (
          <div className="connection-warning">
            <span className="warning-icon">⚠️</span>
            <span>Connection lost. Reconnecting...</span>
          </div>
        )}
      </form>
    </div>
  )
}

export default ChatWindow
