import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import chatAPI from '../services/chatAPI'
import chatSocket from '../services/chatSocket'
import { formatDistanceToNow } from 'date-fns'
import './Chat.css'

const Chat = ({ orderId, onClose }) => {
  const { user, isAuthenticated } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [conversation, setConversation] = useState(null)
  const [otherUser, setOtherUser] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [onlineStatus, setOnlineStatus] = useState({})
  const [socketConnected, setSocketConnected] = useState(false)
  
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Fetch conversation and messages
  const fetchChatData = useCallback(async () => {
    if (!isAuthenticated || !orderId) return

    try {
      setLoading(true)
      
      // Get conversation details
      const convResponse = await chatAPI.getConversation(orderId)
      if (convResponse.data.success) {
        setConversation(convResponse.data.data.conversation)
        setOtherUser(convResponse.data.data.other_party)
      }

      // Get messages
      const msgResponse = await chatAPI.getMessages(orderId, { limit: 50 })
      if (msgResponse.data.success) {
        setMessages(msgResponse.data.data.messages)
      }

      // Mark messages as read
      await chatAPI.markAsRead(orderId)
    } catch (error) {
      console.error('Error fetching chat data:', error)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, orderId])

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault()
    
    if (!newMessage.trim() || sending || !socketConnected) return

    try {
      setSending(true)
      
      const response = await chatAPI.sendMessage(orderId, {
        message: newMessage.trim(),
        messageType: 'text'
      })

      if (response.data.success) {
        setNewMessage('')
        scrollToBottom()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  // Handle typing indicator
  const handleTyping = (value) => {
    setNewMessage(value)
    
    if (value.trim()) {
      chatSocket.startTyping(orderId)
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Stop typing after 1 second of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        chatSocket.stopTyping(orderId)
      }, 1000)
    } else {
      chatSocket.stopTyping(orderId)
    }
  }

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated || !orderId) return

    const token = localStorage.getItem('token')
    if (!token) return

    chatSocket.connect(token)
      .then(() => {
        setSocketConnected(true)
        chatSocket.joinOrder(orderId)
        chatSocket.getOnlineStatus([orderId])
      })
      .catch(error => {
        console.error('Failed to connect chat socket:', error)
        setSocketConnected(false)
      })

    // Socket event listeners
    const handleNewMessage = (data) => {
      if (data.orderid === orderId) {
        setMessages(prev => [...prev, data])
        scrollToBottom()
        
        // Mark as read if we're the receiver
        if (data.receiver_role === user.role) {
          chatAPI.markAsRead(orderId)
        }
      }
    }

    const handleMessageSent = (data) => {
      if (data.orderid === orderId) {
        setMessages(prev => [...prev, data])
        scrollToBottom()
      }
    }

    const handleUserTyping = (data) => {
      if (data.orderId === orderId && data.user.role !== user.role) {
        setIsTyping(true)
      }
    }

    const handleUserStopTyping = (data) => {
      if (data.orderId === orderId && data.user.role !== user.role) {
        setIsTyping(false)
      }
    }

    const handleOnlineStatus = (data) => {
      setOnlineStatus(data)
    }

    const handleConnectionChange = (connected) => {
      setSocketConnected(connected)
    }

    const handleError = (error) => {
      console.error('Socket error:', error)
    }

    // Register event listeners
    chatSocket.on('new_message', handleNewMessage)
    chatSocket.on('message_sent', handleMessageSent)
    chatSocket.on('user_typing', handleUserTyping)
    chatSocket.on('user_stop_typing', handleUserStopTyping)
    chatSocket.on('online_status', handleOnlineStatus)
    chatSocket.on('connection_changed', handleConnectionChange)
    chatSocket.on('error', handleError)

    return () => {
      // Cleanup
      chatSocket.off('new_message', handleNewMessage)
      chatSocket.off('message_sent', handleMessageSent)
      chatSocket.off('user_typing', handleUserTyping)
      chatSocket.off('user_stop_typing', handleUserStopTyping)
      chatSocket.off('online_status', handleOnlineStatus)
      chatSocket.off('connection_changed', handleConnectionChange)
      chatSocket.off('error', handleError)
      
      chatSocket.leaveOrder(orderId)
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [isAuthenticated, orderId, user.role, scrollToBottom])

  // Fetch initial data
  useEffect(() => {
    fetchChatData()
  }, [fetchChatData])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  if (!isAuthenticated) {
    return (
      <div className="chat-container">
        <div className="chat-auth-required">
          <p>Please login to use chat</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-info">
          <h3>Order Chat</h3>
          {otherUser && (
            <div className="chat-user-info">
              <span className="chat-user-name">{otherUser.name}</span>
              <span className={`chat-status ${onlineStatus[orderId]?.is_online ? 'online' : 'offline'}`}>
                {onlineStatus[orderId]?.is_online ? '🟢 Online' : '🔴 Offline'}
              </span>
            </div>
          )}
        </div>
        <button className="chat-close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="chat-messages">
        {loading ? (
          <div className="chat-loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message._id}
                className={`chat-message ${message.is_from_current_user ? 'sent' : 'received'}`}
              >
                <div className="chat-message-content">
                  <p className="chat-message-text">{message.message}</p>
                  <span className="chat-message-time">
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </span>
                  {!message.is_from_current_user && (
                    <span className={`chat-read-status ${message.is_read ? 'read' : 'unread'}`}>
                      {message.is_read ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-typing-indicator">
                <span className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
                <span>Typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form className="chat-input-form" onSubmit={sendMessage}>
        <div className="chat-input-container">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Type a message..."
            className="chat-input"
            disabled={!socketConnected || sending}
            maxLength={1000}
          />
          <button
            type="submit"
            className={`chat-send-btn ${sending ? 'sending' : ''}`}
            disabled={!newMessage.trim() || !socketConnected || sending}
          >
            {sending ? (
              <span className="sending-spinner">⏳</span>
            ) : (
              <span>➤</span>
            )}
          </button>
        </div>
        {!socketConnected && (
          <div className="chat-connection-status">
            <span>🔴 Reconnecting...</span>
          </div>
        )}
      </form>
    </div>
  )
}

export default Chat
