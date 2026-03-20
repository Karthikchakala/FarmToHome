import { useEffect, useState } from 'react'

// Razorpay hook for payment processing
export const useRazorpay = () => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Load Razorpay script
    const loadRazorpay = () => {
      if (window.Razorpay) {
        setIsLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => {
        setIsLoaded(true)
        setError(null)
      }
      script.onerror = () => {
        setError('Failed to load Razorpay SDK')
        setIsLoaded(false)
      }

      document.body.appendChild(script)

      return () => {
        document.body.removeChild(script)
      }
    }

    loadRazorpay()
  }, [])

  const openCheckout = (options) => {
    return new Promise((resolve, reject) => {
      if (!isLoaded || !window.Razorpay) {
        reject(new Error('Razorpay SDK not loaded'))
        return
      }

      const razorpay = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        ...options,
        handler: function(response) {
          resolve(response)
        },
        modal: {
          ondismiss: function() {
            reject(new Error('Payment cancelled by user'))
          },
          escape: true,
          handleback: true,
          confirm_close: true,
          outside: true,
          animate: true
        },
        theme: {
          color: '#2c7a2c'
        }
      })

      razorpay.open()
    })
  }

  return {
    isLoaded,
    error,
    openCheckout
  }
}

// Payment options generator
export const generatePaymentOptions = (order, razorpayOrderId) => {
  return {
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
}

export default useRazorpay
