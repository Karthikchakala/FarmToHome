import { useState } from 'react'
import { Link } from 'react-router-dom'
import './DashboardNavbar.css'

const DashboardNavbar = ({ toggleSidebar, userRole, userName, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    // Implement search functionality
    console.log('Search:', searchQuery)
  }

  const handleLogout = () => {
    setShowProfileMenu(false)
    onLogout()
  }

  const getRoleColor = () => {
    switch (userRole) {
      case 'admin': return '#dc3545'
      case 'farmer': return '#2c7a2c'
      case 'consumer': return '#007bff'
      default: return '#6c757d'
    }
  }

  const getRoleIcon = () => {
    switch (userRole) {
      case 'admin': return '👨‍💼'
      case 'farmer': return '👨‍🌾'
      case 'consumer': return '👤'
      default: return '👤'
    }
  }

  return (
    <nav className="dashboard-navbar">
      <div className="navbar-left">
        <button className="navbar-toggle" onClick={toggleSidebar}>
          <span className="toggle-icon">☰</span>
        </button>
        
        <div className="navbar-search">
          <form onSubmit={handleSearch}>
            <div className="search-input-group">
              <input
                type="text"
                placeholder="Search products, orders, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn">
                <span className="search-icon">🔍</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="navbar-right">
        <div className="navbar-actions">
          {/* Notifications */}
          <button className="action-btn notification-btn">
            <span className="action-icon">🔔</span>
            <span className="notification-badge">3</span>
          </button>

          {/* Messages */}
          <button className="action-btn message-btn">
            <span className="action-icon">💬</span>
          </button>

          {/* Profile Menu */}
          <div className="profile-dropdown">
            <button 
              className="profile-btn"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="profile-avatar">
                <span className="avatar-icon">{getRoleIcon()}</span>
              </div>
              <div className="profile-info">
                <span className="profile-name">{userName || 'User'}</span>
                <span 
                  className="profile-role"
                  style={{ backgroundColor: getRoleColor() }}
                >
                  {userRole?.toUpperCase()}
                </span>
              </div>
              <span className="dropdown-arrow">▼</span>
            </button>

            {showProfileMenu && (
              <div className="profile-menu">
                <div className="menu-header">
                  <div className="menu-avatar">
                    <span className="avatar-icon">{getRoleIcon()}</span>
                  </div>
                  <div className="menu-info">
                    <span className="menu-name">{userName || 'User'}</span>
                    <span className="menu-email">user@example.com</span>
                  </div>
                </div>

                <div className="menu-divider"></div>

                <div className="menu-items">
                  <Link to={`/${userRole}/profile`} className="menu-item">
                    <span className="menu-icon">👤</span>
                    <span>Profile Settings</span>
                  </Link>
                  
                  <Link to={`/${userRole}/settings`} className="menu-item">
                    <span className="menu-icon">⚙️</span>
                    <span>Account Settings</span>
                  </Link>

                  <Link to={`/${userRole}/help`} className="menu-item">
                    <span className="menu-icon">❓</span>
                    <span>Help & Support</span>
                  </Link>
                </div>

                <div className="menu-divider"></div>

                <div className="menu-footer">
                  <button className="menu-item logout-item" onClick={handleLogout}>
                    <span className="menu-icon">🚪</span>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay to close profile menu */}
      {showProfileMenu && (
        <div 
          className="profile-menu-overlay"
          onClick={() => setShowProfileMenu(false)}
        ></div>
      )}
    </nav>
  )
}

export default DashboardNavbar
