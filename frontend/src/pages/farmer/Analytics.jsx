import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import './Analytics.css'

const Analytics = () => {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <div className="analytics">
        <div className="auth-message">
          <h2>Please login to view your analytics</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="analytics">
      <div className="page-header">
        <h1>📈 Analytics</h1>
        <p>View your business performance metrics and insights</p>
      </div>
      
      <div className="analytics-container">
        <div className="no-data">
          <div className="no-data-icon">📈</div>
          <h3>Analytics Data Coming Soon</h3>
          <p>This page will show your sales data, revenue trends, customer analytics, and performance metrics once you start receiving orders and sales.</p>
        </div>
        
        <div className="placeholder-stats">
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <p>₹0</p>
          </div>
          <div className="stat-card">
            <h3>Total Orders</h3>
            <p>0</p>
          </div>
          <div className="stat-card">
            <h3>Active Customers</h3>
            <p>0</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
