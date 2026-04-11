import { useEffect, useState } from 'react'

export const useRazorpay = () => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadRazorpay = () => {
      if (window.Razorpay) {
        setIsLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.defer = true
      script.crossOrigin = 'anonymous'

      script.onload = () => {
        console.log("Razorpay SDK Loaded ✅")
        setIsLoaded(true)
        setError(null)
      }

      script.onerror = () => {
        console.log("Razorpay SDK Failed ❌")
        setError('Failed to load Razorpay SDK')
        setIsLoaded(false)
      }

      document.head.appendChild(script)
    }

    loadRazorpay()
  }, [])

  const openCheckout = (options) => {
    return new Promise((resolve, reject) => {
      if (!isLoaded || !window.Razorpay) {
        reject(new Error('Razorpay SDK not loaded'))
        return
      }

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

      console.log("STEP 0 - Razorpay Key:", razorpayKey)

      if (!razorpayKey) {
        reject(new Error('Razorpay key not configured'))
        return
      }

      const razorpay = new window.Razorpay({
        key: razorpayKey,
        ...options,

        handler: function (response) {
          console.log("STEP 4 - RAW RAZORPAY RESPONSE:", response)

          // Safe fallback
          if (!response.razorpay_order_id) {
            response.razorpay_order_id = options.order_id;
          }

          resolve(response)
        },

        modal: {
          ondismiss: () => reject(new Error('Payment cancelled by user'))
        },

        theme: {
          color: '#2c7a2c'
        }
      })

      razorpay.open()
    })
  }

  return { isLoaded, error, openCheckout }
}