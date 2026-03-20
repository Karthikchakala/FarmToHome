import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import './Settings.css'

const Settings = () => {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <div className="settings">
        <div className="auth-message">
          <h2>Please login to access settings</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="settings">
      <div className="page-header">
        <h1>⚙️ Settings</h1>
      </div>
      
      <div className="settings-container">
        <h2>Account Settings - Coming Soon</h2>
        <p>This page will allow you to manage your account settings, notification preferences, and farm configuration.</p>
        
        <div className="mock-settings">
          <div className="setting-section">
            <h3>Notification Preferences</h3>
            <p>Configure email and SMS notifications</p>
          </div>
          <div className="setting-section">
            <h3>Delivery Settings</h3>
            <p>Set delivery radius and schedule</p>
          </div>
          <div className="setting-section">
            <h3>Payment Settings</h3>
            <p>Manage payment methods and bank details</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
