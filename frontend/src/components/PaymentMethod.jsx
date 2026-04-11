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

  const { isLoaded, openCheckout } = useRazorpay()
  const { success, error: showError } = useToast()

  const handleOnlinePayment = async () => {
    if (!isLoaded) {
      showError('Payment system loading...')
      return
    }

    try {
      setProcessing(true)

      console.log("=== FRONTEND DEBUG ===");
      console.log("Full order object:", order);
      console.log("Order ID being sent:", order.id || order._id);
      console.log("Amount (totalAmount):", order.totalAmount);
      console.log("Amount (totalamount):", order.totalamount);

      const payload = {
        orderId: order.id || order._id,
        amount: order.totalAmount || order.totalamount || cartData?.summary?.finalAmount || 0
      };

      console.log("Payload sent to backend:", payload);

      // ✅ STEP 1: Create order
      let response;
      try {
        response = await paymentAPI.createPaymentOrder(payload)
      } catch (error) {
        console.error('ERROR: API call failed:', error);
        console.error('ERROR: Response data:', error.response?.data);
        console.error('ERROR: Response status:', error.response?.status);
        throw error;
      }

      console.log("STEP 1 - FULL BACKEND RESPONSE:", response.data)

      if (!response.data.success) {
        console.error('ERROR: Backend returned error:', response.data.error);
        throw new Error(response.data.error || 'Failed to create payment order');
      }

      const responseData = response.data.data || response.data

      console.log("STEP 1.1 - EXTRACTED DATA:", responseData)

      // ✅ SAFE extraction
      const razorpayOrderId =
        responseData.razorpayOrderId ||
        responseData.orderId

      console.log("STEP 2 - ORDER ID FROM BACKEND:", razorpayOrderId)

      if (!razorpayOrderId) {
        throw new Error("❌ No razorpayOrderId received from backend")
      }

      // ✅ STEP 2: Prepare options
      const paymentOptions = {
        order_id: razorpayOrderId,
        amount: order.totalAmount * 100,
        currency: 'INR',
        name: 'Farm to Table',
        description: `Payment for order ${order.orderNumber}`,

        prefill: {
          name: order.customerName || '',
          email: order.customerEmail || '',
          contact: order.customerPhone || ''
        },

        notes: {
          orderId: order.id || order._id
        }
      }

      console.log("STEP 3 - PAYMENT OPTIONS:", paymentOptions)

      // ✅ STEP 3: Open Razorpay
      const paymentResponse = await openCheckout(paymentOptions)

      console.log("STEP 4 - FINAL PAYMENT RESPONSE:", paymentResponse)

      // ❌ STOP if missing
      if (!paymentResponse.razorpay_order_id) {
        throw new Error("❌ razorpay_order_id missing from Razorpay")
      }

      // ✅ STEP 4: Verify payment (FINAL FIX)
      const verificationData = {
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
        orderId: order.id || order._id
      }

      console.log("STEP 5 - VERIFY DATA:", verificationData)

      const verifyRes = await paymentAPI.verifyPayment(verificationData)

      if (verifyRes.data.success) {
        success('Payment successful!')

        await onPaymentSuccess?.({
          paymentMethod: 'ONLINE',
          status: 'PAID',
          paymentId: verifyRes.data.data.payment.id,
          transactionId: verifyRes.data.data.payment.transactionId
        })
      }

    } catch (error) {
      console.error("❌ PAYMENT ERROR:", error)

      if (error.message === 'Payment cancelled by user') {
        onPaymentCancel?.(error)
      } else {
        showError(error.message || 'Payment failed')
        onPaymentError?.(error)
      }

    } finally {
      setProcessing(false)
    }
  }

  return (
    <Card className="payment-method">

      <h2>Select Payment Method</h2>

      <label>
        <input
          type="radio"
          checked={selectedMethod === 'COD'}
          onChange={() => setSelectedMethod('COD')}
        />
        COD
      </label>

      <label>
        <input
          type="radio"
          checked={selectedMethod === 'ONLINE'}
          onChange={() => setSelectedMethod('ONLINE')}
        />
        Online
      </label>

      <h3>Total: ₹{order.totalAmount}</h3>

      <Button onClick={handleOnlinePayment} disabled={processing}>
        {processing ? 'Processing...' : 'Pay Now'}
      </Button>

      {!isLoaded && <p>Loading Razorpay...</p>}
    </Card>
  )
}

export default PaymentMethod