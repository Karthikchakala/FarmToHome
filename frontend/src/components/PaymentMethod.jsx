import { useState } from 'react'
import { paymentAPI } from '../services/paymentAPI'
import { useRazorpay } from '../hooks/useRazorpay'
import { useToast } from '../hooks/useToast'
import Button from './Button'
import Card from './Card'
import LoadingSpinner from './LoadingSpinner'
import './PaymentMethod.css'

const PaymentMethod = ({ 
  order, 
  onPaymentSuccess, 
  onPaymentError,
  onPaymentCancel 
}) => {
  const [selectedMethod, setSelectedMethod] = useState('COD')
  const [processing, setProcessing] = useState(false)
  const [razorpayOrderId, setRazorpayOrderId] = useState(null)
  
  const { isLoaded, openCheckout } = useRazorpay()
  const { success, error: showError } = useToast()

  const handlePaymentMethodChange = (method) => {
    setSelectedMethod(method)
  }

  const handleCODPayment = async () => {
    try {
      setProcessing(true)
      
      // For COD, we can directly place the order
      if (onPaymentSuccess) {
        await onPaymentSuccess({
          paymentMethod: 'COD',
          status: 'PENDING'
        })
      }
      
      success('Order placed successfully! Payment will be collected on delivery.')
      
    } catch (error) {
      showError('Failed to place order. Please try again.')
      if (onPaymentError) {
        onPaymentError(error)
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleOnlinePayment = async () => {
    if (!isLoaded) {
      showError('Payment system is loading. Please wait...')
      return
    }

    try {
      setProcessing(true)

      // Create Razorpay order
      const response = await paymentAPI.createPaymentOrder({
        orderId: order.id,
        amount: order.totalAmount
      })

      if (response.data.success) {
        const { razorpayOrderId } = response.data.data
        setRazorpayOrderId(razorpayOrderId)

        // Generate payment options
        const paymentOptions = {
          order_id: razorpayOrderId,
          amount: order.totalAmount * 100, // Convert to paise
          currency: 'INR',
          name: 'Farm to Table',
          description: `Payment for order ${order.orderNumber}`,
          image: '/logo.png',
          prefill: {
            name: order.customerName || '',
            email: order.customerEmail || '',
            contact: order.customerPhone || ''
          },
          notes: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName
          },
          theme: {
            color: '#2c7a2c'
          }
        }

        // Open Razorpay checkout
        const response = await openCheckout(paymentOptions)

        // Verify payment
        const verificationResponse = await paymentAPI.verifyPayment({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
          orderId: order.id
        })

        if (verificationResponse.data.success) {
          success('Payment successful! Your order has been placed.')
          
          if (onPaymentSuccess) {
            await onPaymentSuccess({
              paymentMethod: 'ONLINE',
              status: 'PAID',
              paymentId: verificationResponse.data.data.payment.id,
              transactionId: verificationResponse.data.data.payment.transactionId
            })
          }
        }

      } else {
        throw new Error('Failed to create payment order')
      }

    } catch (error) {
      console.error('Payment error:', error)
      
      if (error.message === 'Payment cancelled by user') {
        if (onPaymentCancel) {
          onPaymentCancel(error)
        }
      } else {
        showError('Payment failed. Please try again.')
        if (onPaymentError) {
          onPaymentError(error)
        }
      }
    } finally {
      setProcessing(false)
    }
  }

  const handlePayment = () => {
    if (selectedMethod === 'COD') {
      handleCODPayment()
    } else if (selectedMethod === 'ONLINE') {
      handleOnlinePayment()
    }
  }

  return (
    <Card className="payment-method">
      <div className="payment-header">
        <h2>Select Payment Method</h2>
        <p>Choose how you'd like to pay for your order</p>
      </div>

      <div className="payment-options">
        <div className="payment-option">
          <label className="payment-option-label">
            <input
              type="radio"
              name="paymentMethod"
              value="COD"
              checked={selectedMethod === 'COD'}
              onChange={() => handlePaymentMethodChange('COD')}
              disabled={processing}
            />
            <div className="payment-option-content">
              <div className="payment-option-info">
                <h3>Cash on Delivery</h3>
                <p>Pay when you receive your order</p>
              </div>
              <div className="payment-option-icon">💵</div>
            </div>
          </label>
        </div>

        <div className="payment-option">
          <label className="payment-option-label">
            <input
              type="radio"
              name="paymentMethod"
              value="ONLINE"
              checked={selectedMethod === 'ONLINE'}
              onChange={() => handlePaymentMethodChange('ONLINE')}
              disabled={processing}
            />
            <div className="payment-option-content">
              <div className="payment-option-info">
                <h3>Online Payment</h3>
                <p>Pay securely with Razorpay</p>
                <div className="payment-methods">
                  <span className="method-badge">Cards</span>
                  <span className="method-badge">UPI</span>
                  <span className="method-badge">Net Banking</span>
                  <span className="method-badge">Wallet</span>
                </div>
              </div>
              <div className="payment-option-icon">💳</div>
            </div>
          </label>
        </div>
      </div>

      <div className="payment-summary">
        <div className="summary-row">
          <span>Order Total:</span>
          <span>₹{order.totalAmount}</span>
        </div>
        {selectedMethod === 'ONLINE' && (
          <div className="summary-row">
            <span>Convenience Fee:</span>
            <span>₹0</span>
          </div>
        )}
        <div className="summary-row total">
          <span>Total Amount:</span>
          <span>₹{order.totalAmount}</span>
        </div>
      </div>

      <div className="payment-actions">
        <Button
          variant="primary"
          size="large"
          onClick={handlePayment}
          loading={processing}
          disabled={processing || (selectedMethod === 'ONLINE' && !isLoaded)}
          fullWidth
        >
          {processing ? (
            <LoadingSpinner size="small" text="" />
          ) : selectedMethod === 'COD' ? (
            'Place Order (COD)'
          ) : (
            'Pay Online'
          )}
        </Button>
      </div>

      {selectedMethod === 'ONLINE' && !isLoaded && (
        <div className="payment-loading">
          <LoadingSpinner size="small" text="Loading payment system..." />
        </div>
      )}

      <div className="payment-security">
        <div className="security-info">
          <h4>🔒 Secure Payment</h4>
          <ul>
            <li>256-bit SSL encryption</li>
            <li>PCI DSS compliant</li>
            <li>Secure payment gateway</li>
            <li>Instant confirmation</li>
          </ul>
        </div>
      </div>
    </Card>
  )
}

export default PaymentMethod
