import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import FeedbackForm from '../../components/FeedbackForm'
import FeedbackList from '../../components/FeedbackList'
import SEO from '../../components/SEO'
import './CustomerFeedback.css'

const CustomerFeedback = () => {
  const [activeTab, setActiveTab] = useState('submit')
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  const handleFeedbackSuccess = (feedbackData) => {
    // Switch to list view after successful submission
    setActiveTab('list')
  }

  const tabs = [
    { id: 'submit', label: 'Submit Feedback', icon: '📝' },
    { id: 'list', label: 'My Feedback', icon: '📋' }
  ]

  return (
    <>
      <SEO
        title="Feedback & Support - Farm to Table"
        description="Submit feedback, report issues, or track your complaints with our platform."
      />

      <div className="customer-feedback">
        <div className="feedback-header">
          <h1>Feedback & Support</h1>
          <p>We value your feedback! Help us improve your experience.</p>
        </div>

        {/* Tab Navigation */}
        <div className="feedback-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="feedback-content">
          {activeTab === 'submit' && (
            <div className="submit-feedback-section">
              <div className="feedback-types">
                <div className="feedback-type-card">
                  <div className="type-header">
                    <h3>📝 Product & Farmer Feedback</h3>
                    <p>Report issues with products, delivery, or farmer services</p>
                  </div>
                  <div className="type-examples">
                    <h4>Examples:</h4>
                    <ul>
                      <li>Product quality or freshness issues</li>
                      <li>Wrong items delivered</li>
                      <li>Packaging problems</li>
                      <li>Delivery delays</li>
                      <li>Farmer behavior concerns</li>
                      <li>Pricing discrepancies</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="feedback-forms">
                <FeedbackForm
                  onSuccess={handleFeedbackSuccess}
                />
              </div>
            </div>
          )}

          {activeTab === 'list' && (
            <div className="list-feedback-section">
              <FeedbackList adminView={false} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default CustomerFeedback
