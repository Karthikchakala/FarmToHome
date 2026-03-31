import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import AdminOrders from '../../components/AdminOrders'
import LoadingSpinner from '../../components/LoadingSpinner'
import './OrderManagement.css'

const AdminOrderManagement = () => {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (isAuthenticated && user?.role !== 'admin') {
      navigate('/unauthorized')
      return
    }
  }, [isAuthenticated, user, navigate])

  if (!isAuthenticated) {
    return (
      <div className="admin-order-management">
        <div className="auth-message">
          <h2>Please login to access admin panel</h2>
        </div>
      </div>
    )
  }

  if (user?.role !== 'admin') {
    return (
      <div className="admin-order-management">
        <div className="auth-message">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-order-management">
      <AdminOrders />
    </div>
  )
}

export default AdminOrderManagement
