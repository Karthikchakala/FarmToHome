import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import FeedbackList from '../../components/FeedbackList'
import FeedbackForm from '../../components/FeedbackForm'
import SEO from '../../components/SEO'
import LoadingSpinner from '../../components/LoadingSpinner'
import './AdminFeedback.css'

const AdminFeedback = () => {
  const [activeTab, setActiveTab] = useState('list')
  const [showStatistics, setShowStatistics] = useState(true)
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  if (authLoading) {
    return <LoadingSpinner size="large" text="Checking authentication..." />
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    navigate('/login')
    return null
  }

  const tabs = [
    { id: 'list', label: 'All Feedback', icon: '📋' },
    { id: 'submit', label: 'Create Response', icon: '📝' },
    { id: 'statistics', label: 'Statistics', icon: '📊' }
  ]

  const handleFeedbackSuccess = (feedbackData) => {
    // Switch to list view after successful submission
    setActiveTab('list')
  }

  const renderStatistics = () => {
    return (
      <div className="feedback-statistics">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <h3>Total Feedback</h3>
              <div className="stat-number">247</div>
              <div className="stat-change positive">+12% this month</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>Pending</h3>
              <div className="stat-number">23</div>
              <div className="stat-change negative">+5 this week</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔄</div>
            <div className="stat-content">
              <h3>In Progress</h3>
              <div className="stat-number">45</div>
              <div className="stat-change neutral">Same as last week</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>Resolved</h3>
              <div className="stat-number">179</div>
              <div className="stat-change positive">+18% this month</div>
            </div>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <h3>Feedback by Category</h3>
            <div className="chart-placeholder">
              <div className="pie-chart">
                <div className="chart-segment product" style={{ '--percentage': '50%' }}></div>
                <div className="chart-segment farmer" style={{ '--percentage': '35%' }}></div>
                <div className="chart-segment other" style={{ '--percentage': '15%' }}></div>
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color product"></span>
                  <span>Product (50%)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color farmer"></span>
                  <span>Farmer (35%)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color other"></span>
                  <span>Other (15%)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <h3>Feedback Trend (Last 30 Days)</h3>
            <div className="chart-placeholder">
              <div className="bar-chart">
                {[65, 78, 90, 81, 56, 85, 92, 88, 76, 95, 89, 102, 98, 110, 105, 95, 88, 92, 78, 85, 90, 95, 88, 92, 98, 105, 110, 95, 88, 92].map((height, index) => (
                  <div 
                    key={index} 
                    className="bar" 
                    style={{ height: `${height}%` }}
                    title={`Day ${index + 1}: ${height} feedback`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="priority-distribution">
          <h3>Priority Distribution</h3>
          <div className="priority-bars">
            <div className="priority-bar">
              <div className="priority-label">Critical</div>
              <div className="priority-progress">
                <div className="priority-fill critical" style={{ width: '15%' }}></div>
              </div>
              <div className="priority-count">37</div>
            </div>
            <div className="priority-bar">
              <div className="priority-label">High</div>
              <div className="priority-progress">
                <div className="priority-fill high" style={{ width: '25%' }}></div>
              </div>
              <div className="priority-count">62</div>
            </div>
            <div className="priority-bar">
              <div className="priority-label">Medium</div>
              <div className="priority-progress">
                <div className="priority-fill medium" style={{ width: '45%' }}></div>
              </div>
              <div className="priority-count">111</div>
            </div>
            <div className="priority-bar">
              <div className="priority-label">Low</div>
              <div className="priority-progress">
                <div className="priority-fill low" style={{ width: '15%' }}></div>
              </div>
              <div className="priority-count">37</div>
            </div>
          </div>
        </div>

        <div className="recent-activity">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">📝</div>
              <div className="activity-content">
                <div className="activity-text">New product quality complaint submitted</div>
                <div className="activity-time">2 minutes ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">✅</div>
              <div className="activity-content">
                <div className="activity-text">Technical issue #123 marked as resolved</div>
                <div className="activity-time">15 minutes ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">🔄</div>
              <div className="activity-content">
                <div className="activity-text">Delivery delay complaint moved to in-progress</div>
                <div className="activity-time">1 hour ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📊</div>
              <div className="activity-content">
                <div className="activity-text">Weekly feedback report generated</div>
                <div className="activity-time">2 hours ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO
        title="Feedback Management - Admin Dashboard"
        description="Manage customer feedback, complaints, and technical issues."
      />

      <div className="admin-feedback">
        <div className="feedback-header">
          <h1>Feedback Management</h1>
          <p>Monitor and respond to customer feedback and complaints</p>
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

        {/* Quick Actions */}
        {activeTab === 'list' && (
          <div className="quick-actions">
            <button className="action-btn primary">
              <span className="action-icon">📊</span>
              <span>Export Report</span>
            </button>
            <button className="action-btn secondary">
              <span className="action-icon">📧</span>
              <span>Send Notifications</span>
            </button>
            <button className="action-btn secondary">
              <span className="action-icon">⚙️</span>
              <span>Settings</span>
            </button>
          </div>
        )}

        {/* Tab Content */}
        <div className="feedback-content">
          {activeTab === 'list' && (
            <div className="list-feedback-section">
              <FeedbackList adminView={true} />
            </div>
          )}

          {activeTab === 'submit' && (
            <div className="submit-feedback-section">
              <div className="admin-form-intro">
                <h2>Create Administrative Response</h2>
                <p>Use this form to create official responses or follow-ups on customer feedback.</p>
              </div>
              <FeedbackForm
                onSuccess={handleFeedbackSuccess}
              />
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="statistics-section">
              {renderStatistics()}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default AdminFeedback
