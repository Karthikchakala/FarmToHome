import { useState } from 'react'
import { Link } from 'react-router-dom'
import { subscriptionAPI } from '../services/subscriptionAPI'
import { useToast } from '../hooks/useToast'
import Button from '../components/Button'
import Card from '../components/Card'
import LazyImage from '../components/LazyImage'
import ConfirmDialog from '../components/ConfirmDialog'
import './SubscriptionCard.css'

const SubscriptionCard = ({ subscription, onUpdate, showActions = true }) => {
  const [loading, setLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [actionType, setActionType] = useState('')
  const { success, error: showError } = useToast()

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success'
      case 'PAUSED': return 'warning'
      case 'CANCELLED': return 'danger'
      default: return 'secondary'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE': return 'Active'
      case 'PAUSED': return 'Paused'
      case 'CANCELLED': return 'Cancelled'
      default: return status
    }
  }

  const getFrequencyText = (frequency) => {
    switch (frequency) {
      case 'WEEKLY': return 'Weekly'
      case 'BIWEEKLY': return 'Bi-weekly'
      case 'MONTHLY': return 'Monthly'
      default: return frequency
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleStatusUpdate = async () => {
    try {
      setLoading(true)
      
      const response = await subscriptionAPI.updateSubscriptionStatus(subscription._id, actionType)
      
      if (response.data.success) {
        success(`Subscription ${actionType.toLowerCase()} successfully`)
        setShowConfirmDialog(false)
        
        if (onUpdate) {
          // Backend returns data: updatedSubscription, not data.data.subscription
          onUpdate(response.data.data)
        }
      }
    } catch (err) {
      showError(`Failed to ${actionType.toLowerCase()} subscription`)
    } finally {
      setLoading(false)
    }
  }

  const openConfirmDialog = (type) => {
    setActionType(type)
    setShowConfirmDialog(true)
  }

  const canPause = subscription.status === 'ACTIVE'
  const canResume = subscription.status === 'PAUSED'
  const canCancel = subscription.status === 'ACTIVE' || subscription.status === 'PAUSED'

  return (
    <>
      <Card className="subscription-card" variant="outlined">
        <div className="subscription-content">
          <div className="subscription-product">
            <div className="product-image">
              <LazyImage
                src={subscription.images?.[0] || '/placeholder-product.jpg'}
                alt={subscription.product_name}
                className="product-img"
              />
            </div>
            <div className="product-info">
              <h3>{subscription.product_name}</h3>
              <p className="farmer-name">{subscription.farmer_name}</p>
              <div className="product-details">
                <span className="quantity">{subscription.quantity} {subscription.unit}</span>
                <span className="price">₹{subscription.price}</span>
              </div>
            </div>
          </div>

          <div className="subscription-details">
            <div className="detail-item">
              <span className="label">Frequency:</span>
              <span className="value">{getFrequencyText(subscription.frequency)}</span>
            </div>
            <div className="detail-item">
              <span className="label">Delivery Day:</span>
              <span className="value">{subscription.deliveryday}</span>
            </div>
            <div className="detail-item">
              <span className="label">Next Delivery:</span>
              <span className="value">{formatDate(subscription.nextdeliverydate)}</span>
            </div>
            <div className="detail-item">
              <span className="label">Status:</span>
              <span className={`status-badge status-${getStatusColor(subscription.status.toLowerCase())}`}>
                {getStatusText(subscription.status)}
              </span>
            </div>
          </div>

          {showActions && (
            <div className="subscription-actions">
              <div className="action-buttons">
                {canPause && (
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => openConfirmDialog('PAUSED')}
                    loading={loading && actionType === 'PAUSED'}
                    disabled={loading}
                  >
                    Pause
                  </Button>
                )}
                
                {canResume && (
                  <Button
                    variant="success"
                    size="small"
                    onClick={() => openConfirmDialog('ACTIVE')}
                    loading={loading && actionType === 'ACTIVE'}
                    disabled={loading}
                  >
                    Resume
                  </Button>
                )}
                
                {canCancel && (
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => openConfirmDialog('CANCELLED')}
                    loading={loading && actionType === 'CANCELLED'}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                )}
              </div>
              
              <Link to={`/products/${subscription.productid}`} className="view-product-link">
                <Button variant="ghost" size="small">
                  View Product
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Card>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleStatusUpdate}
        title={`Confirm ${actionType.toLowerCase()}`}
        message={`Are you sure you want to ${actionType.toLowerCase()} this subscription for ${subscription.product_name}?`}
        confirmText={actionType === 'CANCELLED' ? 'Cancel Subscription' : `${actionType} Subscription`}
        type={actionType === 'CANCELLED' ? 'danger' : actionType === 'PAUSED' ? 'warning' : 'success'}
        confirmButtonVariant={actionType === 'CANCELLED' ? 'danger' : actionType === 'PAUSED' ? 'warning' : 'success'}
      />
    </>
  )
}

export default SubscriptionCard
