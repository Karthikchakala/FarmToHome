import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import './Settings.css'

const AdminSettings = () => {
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    platformName: 'Farm to Table',
    platformEmail: 'admin@farmtotable.com',
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireFarmerApproval: true,
    commissionRate: 5,
    minOrderAmount: 100,
    deliveryRadius: 10000
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API call
        // For now, show default settings
        setSettings({
          platformName: 'Farm to Table',
          platformEmail: 'admin@farmtotable.com',
          maintenanceMode: false,
          allowNewRegistrations: true,
          requireFarmerApproval: true,
          commissionRate: 5,
          minOrderAmount: 100,
          deliveryRadius: 10000
        })
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchSettings()
    }
  }, [isAuthenticated])

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveSettings = async () => {
    try {
      // TODO: Replace with actual API call
      console.log('Saving settings:', settings)
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-settings">
        <div className="auth-message">
          <h2>Please login to access admin panel</h2>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="admin-settings">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="admin-settings">
      <div className="page-header">
        <h1>⚙️ Settings</h1>
        <p>Platform configuration and system settings</p>
      </div>

      <div className="settings-container">
        <div className="settings-section">
          <h2>Platform Settings</h2>
          <div className="settings-grid">
            <div className="setting-item">
              <label>Platform Name</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => handleSettingChange('platformName', e.target.value)}
                className="setting-input"
              />
            </div>
            <div className="setting-item">
              <label>Platform Email</label>
              <input
                type="email"
                value={settings.platformEmail}
                onChange={(e) => handleSettingChange('platformEmail', e.target.value)}
                className="setting-input"
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>User Registration</h2>
          <div className="settings-grid">
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.allowNewRegistrations}
                  onChange={(e) => handleSettingChange('allowNewRegistrations', e.target.checked)}
                />
                Allow New User Registrations
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.requireFarmerApproval}
                  onChange={(e) => handleSettingChange('requireFarmerApproval', e.target.checked)}
                />
                Require Farmer Approval
              </label>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>Business Settings</h2>
          <div className="settings-grid">
            <div className="setting-item">
              <label>Commission Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.commissionRate}
                onChange={(e) => handleSettingChange('commissionRate', parseFloat(e.target.value))}
                className="setting-input"
              />
            </div>
            <div className="setting-item">
              <label>Minimum Order Amount (₹)</label>
              <input
                type="number"
                min="0"
                value={settings.minOrderAmount}
                onChange={(e) => handleSettingChange('minOrderAmount', parseFloat(e.target.value))}
                className="setting-input"
              />
            </div>
            <div className="setting-item">
              <label>Default Delivery Radius (meters)</label>
              <input
                type="number"
                min="0"
                value={settings.deliveryRadius}
                onChange={(e) => handleSettingChange('deliveryRadius', parseInt(e.target.value))}
                className="setting-input"
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>System Settings</h2>
          <div className="settings-grid">
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                />
                Maintenance Mode
              </label>
              <small>When enabled, users will see a maintenance message</small>
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn btn-primary" onClick={handleSaveSettings}>
            Save Settings
          </button>
          <button className="btn btn-secondary">
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings
