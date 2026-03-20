import { useState } from 'react'
import { subscriptionAPI } from '../services/subscriptionAPI'
import { useToast } from '../hooks/useToast'
import Button from '../components/Button'
import Input from '../components/Input'
import Card from '../components/Card'
import ConfirmDialog from '../components/ConfirmDialog'
import './CreateSubscription.css'

const CreateSubscription = ({ product, onSubscriptionCreated, onClose }) => {
  const [formData, setFormData] = useState({
    productId: product._id,
    frequency: 'WEEKLY',
    deliveryDay: 'MONDAY',
    quantity: 1,
    deliveryAddress: {
      home: '',
      street: '',
      landmark: '',
      city: '',
      state: '',
      pincode: ''
    }
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const { success, error: showError } = useToast()

  const frequencyOptions = [
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'BIWEEKLY', label: 'Bi-weekly' },
    { value: 'MONTHLY', label: 'Monthly' }
  ]

  const deliveryDayOptions = [
    { value: 'MONDAY', label: 'Monday' },
    { value: 'TUESDAY', label: 'Tuesday' },
    { value: 'WEDNESDAY', label: 'Wednesday' },
    { value: 'THURSDAY', label: 'Thursday' },
    { value: 'FRIDAY', label: 'Friday' },
    { value: 'SATURDAY', label: 'Saturday' },
    { value: 'SUNDAY', label: 'Sunday' }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        deliveryAddress: {
          ...prev.deliveryAddress,
          [addressField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.frequency) {
      newErrors.frequency = 'Frequency is required'
    }

    if (!formData.deliveryDay) {
      newErrors.deliveryDay = 'Delivery day is required'
    }

    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1'
    }

    // Validate address
    const addressErrors = {}
    if (!formData.deliveryAddress.home.trim()) {
      addressErrors.home = 'House/Flat number is required'
    }
    if (!formData.deliveryAddress.street.trim()) {
      addressErrors.street = 'Street address is required'
    }
    if (!formData.deliveryAddress.city.trim()) {
      addressErrors.city = 'City is required'
    }
    if (!formData.deliveryAddress.state.trim()) {
      addressErrors.state = 'State is required'
    }
    if (!formData.deliveryAddress.pincode.trim()) {
      addressErrors.pincode = 'Pincode is required'
    } else if (!/^[1-9][0-9]{5}$/.test(formData.deliveryAddress.pincode)) {
      addressErrors.pincode = 'Valid pincode is required (6 digits)'
    }

    if (Object.keys(addressErrors).length > 0) {
      newErrors.deliveryAddress = addressErrors
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      showError('Please fix the errors in the form')
      return
    }

    setShowConfirmDialog(true)
  }

  const handleCreateSubscription = async () => {
    try {
      setLoading(true)
      
      const response = await subscriptionAPI.createSubscription(formData)
      
      if (response.data.success) {
        success('Subscription created successfully!')
        setShowConfirmDialog(false)
        
        if (onSubscriptionCreated) {
          onSubscriptionCreated(response.data.data.subscription)
        }
        
        if (onClose) {
          onClose()
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to create subscription'
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalPrice = () => {
    return (product.priceperunit * formData.quantity).toFixed(2)
  }

  return (
    <>
      <Card className="create-subscription">
        <div className="subscription-header">
          <h2>Create Subscription</h2>
          <p>Set up recurring delivery for {product.name}</p>
        </div>

        <div className="product-summary">
          <div className="product-info">
            <h3>{product.name}</h3>
            <p className="farmer-name">{product.farmer_name}</p>
            <div className="price-info">
              <span className="price-per-unit">₹{product.priceperunit} / {product.unit}</span>
              <span className="total-price">Total: ₹{calculateTotalPrice()}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="subscription-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="frequency">Frequency</label>
              <select
                id="frequency"
                name="frequency"
                value={formData.frequency}
                onChange={handleInputChange}
                className={`form-select ${errors.frequency ? 'error' : ''}`}
              >
                {frequencyOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.frequency && <span className="error-message">{errors.frequency}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="deliveryDay">Delivery Day</label>
              <select
                id="deliveryDay"
                name="deliveryDay"
                value={formData.deliveryDay}
                onChange={handleInputChange}
                className={`form-select ${errors.deliveryDay ? 'error' : ''}`}
              >
                {deliveryDayOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.deliveryDay && <span className="error-message">{errors.deliveryDay}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Quantity</label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                max={product.stockquantity}
                value={formData.quantity}
                onChange={handleInputChange}
                error={errors.quantity}
                placeholder="Enter quantity"
              />
            </div>
          </div>

          <div className="address-section">
            <h3>Delivery Address</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="address.home">House/Flat Number</label>
                <Input
                  id="address.home"
                  name="address.home"
                  value={formData.deliveryAddress.home}
                  onChange={handleInputChange}
                  error={errors.deliveryAddress?.home}
                  placeholder="123"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address.street">Street Address</label>
                <Input
                  id="address.street"
                  name="address.street"
                  value={formData.deliveryAddress.street}
                  onChange={handleInputChange}
                  error={errors.deliveryAddress?.street}
                  placeholder="Main Street"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address.landmark">Landmark (Optional)</label>
                <Input
                  id="address.landmark"
                  name="address.landmark"
                  value={formData.deliveryAddress.landmark}
                  onChange={handleInputChange}
                  placeholder="Near Park, Temple, etc."
                />
              </div>

              <div className="form-group">
                <label htmlFor="address.city">City</label>
                <Input
                  id="address.city"
                  name="address.city"
                  value={formData.deliveryAddress.city}
                  onChange={handleInputChange}
                  error={errors.deliveryAddress?.city}
                  placeholder="Bangalore"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address.state">State</label>
                <Input
                  id="address.state"
                  name="address.state"
                  value={formData.deliveryAddress.state}
                  onChange={handleInputChange}
                  error={errors.deliveryAddress?.state}
                  placeholder="Karnataka"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address.pincode">Pincode</label>
                <Input
                  id="address.pincode"
                  name="address.pincode"
                  value={formData.deliveryAddress.pincode}
                  onChange={handleInputChange}
                  error={errors.deliveryAddress?.pincode}
                  placeholder="560001"
                />
              </div>
            </div>
          </div>

          <div className="subscription-summary">
            <div className="summary-row">
              <span>Product:</span>
              <span>{product.name}</span>
            </div>
            <div className="summary-row">
              <span>Quantity:</span>
              <span>{formData.quantity} {product.unit}</span>
            </div>
            <div className="summary-row">
              <span>Frequency:</span>
              <span>{frequencyOptions.find(f => f.value === formData.frequency)?.label}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Day:</span>
              <span>{deliveryDayOptions.find(d => d.value === formData.deliveryDay)?.label}</span>
            </div>
            <div className="summary-row total">
              <span>Total per delivery:</span>
              <span>₹{calculateTotalPrice()}</span>
            </div>
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Subscription'}
            </Button>
          </div>
        </form>
      </Card>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleCreateSubscription}
        title="Confirm Subscription"
        message={`Are you sure you want to create a subscription for ${product.name} (${formData.quantity} ${product.unit})? You'll be charged ₹${calculateTotalPrice()} per delivery.`}
        confirmText="Create Subscription"
        type="success"
        confirmButtonVariant="success"
      />
    </>
  )
}

export default CreateSubscription
