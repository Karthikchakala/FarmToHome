import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import agriToolsAPI from '../services/agriToolsAPI'
import './FloatingChatbot.css'

const BotIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 2a4 4 0 0 0-4 4v1H6a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6h4a6 6 0 0 0 6-6V9a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" />
    <path d="M9 11h.01M15 11h.01M9.5 15c1 .8 2 .8 3 0" />
  </svg>
)

const ExpandIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M15 3h6v6" />
    <path d="M9 21H3v-6" />
    <path d="M21 3l-7 7" />
    <path d="M3 21l7-7" />
  </svg>
)

const MinimizeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M8 3H3v5" />
    <path d="M16 3h5v5" />
    <path d="M3 16v5h5" />
    <path d="M21 16v5h-5" />
  </svg>
)

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M18 6 6 18" />
    <path d="M6 6l12 12" />
  </svg>
)

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M2 21l20-9L2 3v7l14 2-14 2z" />
  </svg>
)

export default function FloatingChatbot() {
  const location = useLocation()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const hiddenPaths = ['/', '/login', '/signup', '/ai-assistant', '/farmer/ai-assistant']
  const isHidden = hiddenPaths.some((path) => location.pathname === path || location.pathname.startsWith(path + '/'))

  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState([
    {
      type: 'bot',
      text: 'Hello! I am your Farm To Home AI Assistant. Ask me about crops, pests, yield, pricing, or storage.'
    }
  ])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, isOpen, loading])

  if (authLoading || !isAuthenticated || isHidden) return null

  const handleAsk = async (e) => {
    e.preventDefault()
    if (!question.trim()) return

    const userMessage = question.trim()
    setQuestion('')
    setChatHistory((prev) => [...prev, { type: 'user', text: userMessage }])
    setLoading(true)

    try {
      const response = await agriToolsAPI.askAssistant(userMessage)
      const result = response.data?.data

      setChatHistory((prev) => [
        ...prev,
        {
          type: 'bot',
          text: result?.response || 'I could not generate a response just now.'
        }
      ])
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        {
          type: 'error',
          text: error.response?.data?.message || 'Cannot reach the AI assistant right now.'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="assistant-floating-button"
          aria-label="Open AI Assistant"
        >
          <span className="assistant-floating-button__icon">
            <BotIcon />
          </span>
        </button>
      )}

      {isOpen && (
        <div
          className={`assistant-floating-panel ${isExpanded ? 'assistant-floating-panel--expanded' : ''}`}
        >
          <div className="assistant-floating-panel__header">
            <div className="assistant-floating-panel__title">
              <span className="assistant-floating-panel__title-icon">
                <BotIcon />
              </span>
              <span>AI Assistant</span>
            </div>

            <div className="assistant-floating-panel__actions">
              <button
                onClick={() => setIsExpanded((current) => !current)}
                className="assistant-floating-panel__icon-button"
                aria-label={isExpanded ? 'Minimize chatbot' : 'Expand chatbot'}
              >
                <span className="assistant-floating-panel__icon">
                  {isExpanded ? <MinimizeIcon /> : <ExpandIcon />}
                </span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="assistant-floating-panel__icon-button"
                aria-label="Close chatbot"
              >
                <span className="assistant-floating-panel__icon">
                  <CloseIcon />
                </span>
              </button>
            </div>
          </div>

          <div className="assistant-floating-panel__body">
            <div className="assistant-chat-list">
              {chatHistory.map((msg, idx) => (
                <div
                  key={`${msg.type}-${idx}`}
                  className={`assistant-chat-row assistant-chat-row--${msg.type}`}
                >
                  <div className={`assistant-chat-bubble assistant-chat-bubble--${msg.type}`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="assistant-chat-row assistant-chat-row--bot">
                  <div className="assistant-chat-bubble assistant-chat-bubble--bot assistant-chat-bubble--loading">
                    Thinking...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <form onSubmit={handleAsk} className="assistant-floating-panel__footer">
            <div className="assistant-floating-panel__input-wrap">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a farming question..."
                className="assistant-floating-panel__input"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!question.trim() || loading}
                className="assistant-floating-panel__send"
                aria-label="Send"
              >
                <span className="assistant-floating-panel__icon">
                  <SendIcon />
                </span>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
