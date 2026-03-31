import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import CustomerOrders from '../../components/CustomerOrders'
import LoadingSpinner from '../../components/LoadingSpinner'
import './CustomerOrdersPage.css'

const CustomerOrdersPage = () => {
  const { user, isAuthenticated, authLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/login')
        return
      }

      if (isAuthenticated && user?.role !== 'customer') {
        navigate('/unauthorized')
        return
      }
    }
  }, [isAuthenticated, user, authLoading, navigate])

  if (authLoading) {
    return (
      <div className="customer-orders-page">
        <LoadingSpinner size="large" text="Checking authentication..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="customer-orders-page">
        <div className="auth-message">
          <h2>Please login to view your orders</h2>
          <p>You need to be logged in to access this page.</p>
        </div>
      </div>
    )
  }

  if (user?.role !== 'customer') {
    return (
      <div className="customer-orders-page">
        <div className="auth-message">
          <h2>Access Denied</h2>
          <p>This page is only available for customers.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="customer-orders-page">
      <CustomerOrders />
    </div>
  )
}

export default CustomerOrdersPage
