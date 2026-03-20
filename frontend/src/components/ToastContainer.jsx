import { useState, useEffect } from 'react'
import Toast from './Toast'
import { toastManager } from '../hooks/useToast'
import './ToastContainer.css'

const ToastContainer = () => {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    // Subscribe to toast manager
    const unsubscribe = toastManager.subscribe(setToasts)
    
    // Initialize with existing toasts
    setToasts(toastManager.getToasts())
    
    return unsubscribe
  }, [])

  const handleRemove = (id) => {
    toastManager.removeToast(id)
  }

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => handleRemove(toast.id)}
        />
      ))}
    </div>
  )
}

export default ToastContainer
