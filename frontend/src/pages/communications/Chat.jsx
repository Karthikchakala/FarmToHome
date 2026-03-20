import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ChatWindow from '../../components/ChatWindow'
import { authAPI } from '../../services/api'
import './Chat.css'

const Chat = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  
  const [currentUser, setCurrentUser] = useState(null)
  const [otherUser, setOtherUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    const initializeChat = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get current user info
        const token = localStorage.getItem('token')
        if (!token) {
          navigate('/login')
          return
        }

        const profileResponse = await authAPI.getProfile()
        if (profileResponse.data.success) {
          setCurrentUser(profileResponse.data.data)
        } else {
          setError('Failed to load user profile')
          return
        }

        // Get other user info
        const userResponse = await fetch(`/api/auth/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (userResponse.ok) {
          const userData = await userResponse.json()
          if (userData.success) {
            setOtherUser(userData.data)
            setShowChat(true)
          } else {
            setError(userData.error || 'User not found')
          }
        } else {
          setError('User not found')
        }

      } catch (err) {
        console.error('Error initializing chat:', err)
        setError('Failed to load chat')
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      initializeChat()
    } else {
      setError('User ID is required')
      setLoading(false)
    }
  }, [userId, navigate])

  const handleCloseChat = () => {
    navigate(-1) // Go back to previous page
  }

  if (loading) {
    return (
      <div className="chat-page">
        <div className="chat-loading">
          <div className="spinner"></div>
          <p>Loading chat...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="chat-page">
        <div className="chat-error">
          <div className="error-icon">⚠️</div>
          <h2>Chat Error</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              🔄 Retry
            </button>
            <button className="btn btn-outline" onClick={handleCloseChat}>
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser || !otherUser) {
    return (
      <div className="chat-page">
        <div className="chat-error">
          <div className="error-icon">⚠️</div>
          <h2>User Not Found</h2>
          <p>The user you're trying to chat with is not available.</p>
          <button className="btn btn-primary" onClick={handleCloseChat}>
            ← Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-page">
      {showChat && (
        <ChatWindow
          currentUserId={currentUser._id}
          otherUserId={otherUser._id}
          otherUserName={otherUser.name}
          otherUserRole={otherUser.role}
          onClose={handleCloseChat}
        />
      )}
    </div>
  )
}

export default Chat
