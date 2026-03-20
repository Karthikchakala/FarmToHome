import { useState, useCallback } from 'react'

// Toast context and hook for global toast notifications
let toastCount = 0

export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++toastCount
    const newToast = { id, message, type, duration }
    
    setToasts(prev => [...prev, newToast])
    
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const success = useCallback((message, duration) => {
    return addToast(message, 'success', duration)
  }, [addToast])

  const error = useCallback((message, duration) => {
    return addToast(message, 'error', duration)
  }, [addToast])

  const warning = useCallback((message, duration) => {
    return addToast(message, 'warning', duration)
  }, [addToast])

  const info = useCallback((message, duration) => {
    return addToast(message, 'info', duration)
  }, [addToast])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearAll
  }
}

// Global toast manager (for use outside React components)
class ToastManager {
  constructor() {
    this.listeners = []
    this.toasts = []
  }

  subscribe(listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  addToast(message, type = 'info', duration = 3000) {
    const id = ++toastCount
    const toast = { id, message, type, duration }
    
    this.toasts.push(toast)
    this.notifyListeners()
    
    // Auto remove after duration
    setTimeout(() => {
      this.removeToast(id)
    }, duration)
    
    return id
  }

  removeToast(id) {
    this.toasts = this.toasts.filter(toast => toast.id !== id)
    this.notifyListeners()
  }

  clearAll() {
    this.toasts = []
    this.notifyListeners()
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.toasts))
  }

  success(message, duration) {
    return this.addToast(message, 'success', duration)
  }

  error(message, duration) {
    return this.addToast(message, 'error', duration)
  }

  warning(message, duration) {
    return this.addToast(message, 'warning', duration)
  }

  info(message, duration) {
    return this.addToast(message, 'info', duration)
  }

  getToasts() {
    return this.toasts
  }
}

export const toastManager = new ToastManager()
