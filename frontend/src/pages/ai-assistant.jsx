import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import Layout from '../components/Layout'
import agriToolsAPI from '../services/agriToolsAPI'
import './ai-assistant.css'

const AssistantIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2l1.9 5.7L20 9.6l-5.1 3.7L16.8 19 12 15.9 7.2 19l1.9-5.7L4 9.6l6.1-1.9L12 2z" />
  </svg>
)

const BubbleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M4 5h16v10H8l-4 4V5z" />
  </svg>
)

const AIAssistant = () => {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState([])
  const [tips, setTips] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadTips = async () => {
      try {
        console.log('[AI Assistant] loading tips')
        const response = await agriToolsAPI.getAssistantTips()
        console.log('[AI Assistant] tips response', response.data)
        if (response.data.success) {
          setTips(response.data.data.tips || [])
        }
      } catch (error) {
        console.error('[AI Assistant] tips request failed', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        })
        // Tips are optional and should never block the page.
      }
    }

    loadTips()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    const currentQuery = query.trim()
    setMessages((prev) => [...prev, { type: 'user', content: currentQuery }])
    setQuery('')
    setLoading(true)

    try {
      console.log('[AI Assistant] submitting query', {
        queryLength: currentQuery.length,
        hasToken: !!localStorage.getItem('token'),
      })
      const response = await agriToolsAPI.askAssistant(currentQuery)
      console.log('[AI Assistant] chat response', response.data)
      const result = response.data?.data

      setMessages((prev) => [
        ...prev,
        {
          type: 'ai',
          content: result?.response || 'I could not generate a response just now.',
        }
      ])
    } catch (error) {
      console.error('[AI Assistant] chat request failed', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
      toast.error(error.response?.data?.message || 'Error communicating with the AI assistant')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout showSidebar>
      <div className="assistant-page">
        <section className="assistant-hero">
          <div className="assistant-badge">
            <span className="assistant-badge__icon">
              <AssistantIcon />
            </span>
            <span>Farm To Home AI Assistant</span>
          </div>
          <h1>Ask about your crops in plain language.</h1>
          <p>
            Get knowledge-based answers about yield, pests, pricing, storage, soil, and season planning from the
            RAG knowledge base. The assistant stays focused on practical farming guidance.
          </p>
        </section>

        {tips.length > 0 && (
          <section className="assistant-tips">
            <div className="assistant-section-title">
              <span className="assistant-section-title__icon">
                <BubbleIcon />
              </span>
              <h2>Suggested ways to ask</h2>
            </div>
            <div className="assistant-tip-grid">
              {tips.map((tip) => (
                <div key={tip} className="assistant-tip-card">
                  {tip}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="assistant-grid">
          <form onSubmit={handleSubmit} className="assistant-card assistant-form">
            <label className="assistant-label" htmlFor="assistant-question">
              Your question
            </label>
            <textarea
              id="assistant-question"
              rows="7"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Example: My tomato crop is flowering in humid weather. What should I watch for?"
              className="assistant-textarea"
            />
            <div className="assistant-form-footer">
              <p>
                Try adding the crop name, stage, soil type, or problem you are seeing.
              </p>
              <button type="submit" disabled={loading || !query.trim()} className="assistant-button">
                {loading ? 'Thinking...' : 'Ask assistant'}
              </button>
            </div>
          </form>

          <div className="assistant-card assistant-response">
            <div className="assistant-section-title">
              <span className="assistant-section-title__icon">
                <BubbleIcon />
              </span>
              <h2>Assistant response</h2>
            </div>

            <div className="assistant-response-box">
              {messages.length === 0 ? (
                <p className="assistant-empty-state">
                  Ask a crop question and the answer will appear here.
                </p>
              ) : (
                messages.map((msg, index) => (
                  <div key={`${msg.type}-${index}`} className={`chat-row chat-row--${msg.type}`}>
                    <div className={`chat-bubble chat-bubble--${msg.type}`}>
                      <div className="chat-bubble__text">{msg.content}</div>
                    </div>
                  </div>
                ))
              )}

              {loading && (
                <div className="chat-row chat-row--ai">
                  <div className="chat-bubble chat-bubble--ai chat-bubble--loading">
                    AI is thinking...
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  )
}

export default AIAssistant
