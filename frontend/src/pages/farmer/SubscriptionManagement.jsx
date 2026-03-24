import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { subscriptionAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import './SubscriptionManagement.css'

const SubscriptionManagement = () => {
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedSubscription, setSelectedSubscription] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true)
        const params = {
          _t: Date.now() // Cache-busting parameter
        }
        if (filterStatus !== 'all') {
          params.status = filterStatus
        }
        
        const response = await subscriptionAPI.getFarmerSubscriptions(params)
        
        console.log('Farmer subscriptions API response:', response)
        console.log('Response data:', response.data)
        console.log('Response status:', response.status)
        
        if (response.data.success) {
          const subscriptions = response.data.data.subscriptions || []
          console.log('Raw subscriptions from API:', subscriptions)
          console.log('Setting subscriptions:', subscriptions)
          setSubscriptions(subscriptions)
        } else {
          console.error('Failed to fetch subscriptions:', response.data.error)
          setSubscriptions([])
        }
      } catch (error) {
        console.error('Error fetching subscriptions:', error)
        setSubscriptions([])
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchSubscriptions()
    }
  }, [isAuthenticated, filterStatus])

  const filteredSubscriptions = subscriptions.filter(sub => {
    return filterStatus === 'all' || sub.status === filterStatus
  })

  const updateSubscriptionStatus = async (subscriptionId, newStatus) => {
    try {
      // API call to update subscription status
      setSubscriptions(subscriptions.map(sub => 
        sub._id === subscriptionId ? { ...sub, status: newStatus } : sub
      ))
    } catch (error) {
      console.error('Error updating subscription status:', error)
    }
  }

  const viewSubscriptionDetails = (subscription) => {
    setSelectedSubscription(subscription)
    setShowModal(true)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return '#28a745'
      case 'PAUSED': return '#ffc107'
      case 'CANCELLED': return '#dc3545'
      case 'EXPIRED': return '#6c757d'
      default: return '#6c757d'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE': return '✅'
      case 'PAUSED': return '⏸️'
      case 'CANCELLED': return '❌'
      case 'EXPIRED': return '⏰'
      default: return '📋'
    }
  }

  const getFrequencyLabel = (frequency) => {
    switch (frequency) {
      case 'WEEKLY': return 'Every Week'
      case 'BIWEEKLY': return 'Every 2 Weeks'
      case 'MONTHLY': return 'Every Month'
      default: return frequency
    }
  }

  const calculateTotalRevenue = () => {
    return subscriptions.reduce((total, sub) => total + sub.monthlyRevenue, 0)
  }

  if (!isAuthenticated) {
    return (
      <div className="subscription-management">
        <div className="auth-message">
          <h2>Please login to view your subscriptions</h2>
        </div>
      </div>
    )
  }

  if (loading) {
    return <LoadingSpinner size="large" text="Loading subscriptions..." />
  }

  return (
    <div className="subscription-management">
      <div className="page-header">
        <h1>🔄 Customer Subscriptions</h1>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{subscriptions.length}</span>
            <span className="stat-label">Total Subscriptions</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{subscriptions.filter(s => s.status === 'ACTIVE').length}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">₹{calculateTotalRevenue()}</span>
            <span className="stat-label">Monthly Revenue</span>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            📋 All ({subscriptions.length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setFilterStatus('ACTIVE')}
          >
            ✅ Active ({subscriptions.filter(s => s.status === 'ACTIVE').length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'PAUSED' ? 'active' : ''}`}
            onClick={() => setFilterStatus('PAUSED')}
          >
            ⏸️ Paused ({subscriptions.filter(s => s.status === 'PAUSED').length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'CANCELLED' ? 'active' : ''}`}
            onClick={() => setFilterStatus('CANCELLED')}
          >
            ❌ Cancelled ({subscriptions.filter(s => s.status === 'CANCELLED').length})
          </button>
        </div>
      </div>

      <div className="subscriptions-container">
        {filteredSubscriptions.length === 0 ? (
          <div className="no-subscriptions">
            <div className="no-subscriptions-icon">🔄</div>
            <h3>No subscriptions found</h3>
            <p>
              {filterStatus !== 'all' 
                ? `No ${filterStatus.toLowerCase()} subscriptions at the moment`
                : 'You don\'t have any customer subscriptions yet'
              }
            </p>
          </div>
        ) : (
          <div className="subscriptions-grid">
            {filteredSubscriptions.map(subscription => (
              <div key={subscription._id} className="subscription-card">
                <div className="subscription-header">
                  <div className="customer-info">
                    <h3>👤 {subscription.consumerName}</h3>
                    <p className="customer-email">📧 {subscription.consumerEmail}</p>
                    <p className="customer-phone">📱 {subscription.consumerPhone}</p>
                  </div>
                  <div className="subscription-status">
                    <div 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(subscription.status) }}
                    >
                      {getStatusIcon(subscription.status)} {subscription.status}
                    </div>
                  </div>
                </div>

                <div className="subscription-product">
                  <h4>🌾 Product Details</h4>
                  <div className="product-info">
                    <div className="product-name">{subscription.productName}</div>
                    <div className="product-details">
                      <span className="detail-item">
                        {subscription.quantity} {subscription.unit} × {getFrequencyLabel(subscription.frequency)}
                      </span>
                      <span className="detail-item price">
                        ₹{subscription.pricePerUnit * subscription.quantity}/delivery
                      </span>
                    </div>
                  </div>
                </div>

                <div className="subscription-schedule">
                  <h4>📅 Delivery Schedule</h4>
                  <div className="schedule-details">
                    <div className="schedule-item">
                      <span className="label">Delivery Day:</span>
                      <span className="value">{subscription.deliveryDay}</span>
                    </div>
                    <div className="schedule-item">
                      <span className="label">Next Delivery:</span>
                      <span className="value">{new Date(subscription.nextDeliveryDate).toLocaleDateString()}</span>
                    </div>
                    <div className="schedule-item">
                      <span className="label">Total Deliveries:</span>
                      <span className="value">{subscription.totalDeliveries}</span>
                    </div>
                  </div>
                </div>

                <div className="subscription-revenue">
                  <h4>💰 Revenue</h4>
                  <div className="revenue-details">
                    <div className="revenue-item">
                      <span className="label">Monthly Revenue:</span>
                      <span className="value monthly">₹{subscription.monthlyRevenue}</span>
                    </div>
                  </div>
                </div>

                {subscription.notes && (
                  <div className="subscription-notes">
                    <h4>📝 Notes</h4>
                    <p>{subscription.notes}</p>
                  </div>
                )}

                <div className="subscription-actions">
                  <button
                    onClick={() => viewSubscriptionDetails(subscription)}
                    className="btn btn-outline"
                  >
                    👁️ View Details
                  </button>
                  
                  {subscription.status === 'ACTIVE' && (
                    <button
                      onClick={() => updateSubscriptionStatus(subscription._id, 'PAUSED')}
                      className="btn btn-warning"
                    >
                      ⏸️ Pause
                    </button>
                  )}
                  
                  {subscription.status === 'PAUSED' && (
                    <button
                      onClick={() => updateSubscriptionStatus(subscription._id, 'ACTIVE')}
                      className="btn btn-success"
                    >
                      ▶️ Resume
                    </button>
                  )}
                  
                  {subscription.status !== 'CANCELLED' && (
                    <button
                      onClick={() => updateSubscriptionStatus(subscription._id, 'CANCELLED')}
                      className="btn btn-danger"
                    >
                      ❌ Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscription Details Modal */}
      {showModal && selectedSubscription && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>🔄 Subscription Details</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="subscription-detail-section">
                <h4>👤 Customer Information</h4>
                <p><strong>Name:</strong> {selectedSubscription.consumerName}</p>
                <p><strong>Email:</strong> {selectedSubscription.consumerEmail}</p>
                <p><strong>Phone:</strong> {selectedSubscription.consumerPhone}</p>
              </div>
              
              <div className="subscription-detail-section">
                <h4>📍 Delivery Address</h4>
                <p>{selectedSubscription.deliveryAddress.street}</p>
                <p>{selectedSubscription.deliveryAddress.city}, {selectedSubscription.deliveryAddress.state}</p>
                <p>{selectedSubscription.deliveryAddress.pincode}</p>
              </div>
              
              <div className="subscription-detail-section">
                <h4>🌾 Product Information</h4>
                <p><strong>Product:</strong> {selectedSubscription.productName}</p>
                <p><strong>Category:</strong> {selectedSubscription.category}</p>
                <p><strong>Quantity:</strong> {selectedSubscription.quantity} {selectedSubscription.unit}</p>
                <p><strong>Frequency:</strong> {getFrequencyLabel(selectedSubscription.frequency)}</p>
                <p><strong>Price per Delivery:</strong> ₹{selectedSubscription.pricePerUnit * selectedSubscription.quantity}</p>
              </div>
              
              <div className="subscription-detail-section">
                <h4>📅 Schedule Information</h4>
                <p><strong>Delivery Day:</strong> {selectedSubscription.deliveryDay}</p>
                <p><strong>Start Date:</strong> {new Date(selectedSubscription.startDate).toLocaleDateString()}</p>
                <p><strong>Next Delivery:</strong> {new Date(selectedSubscription.nextDeliveryDate).toLocaleDateString()}</p>
                <p><strong>Total Deliveries:</strong> {selectedSubscription.totalDeliveries}</p>
              </div>
              
              <div className="subscription-detail-section">
                <h4>💰 Revenue Information</h4>
                <p><strong>Monthly Revenue:</strong> ₹{selectedSubscription.monthlyRevenue}</p>
                <p><strong>Annual Revenue:</strong> ₹{selectedSubscription.monthlyRevenue * 12}</p>
              </div>
              
              {selectedSubscription.notes && (
                <div className="subscription-detail-section">
                  <h4>📝 Customer Notes</h4>
                  <p>{selectedSubscription.notes}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowModal(false)}
                className="btn btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubscriptionManagement
