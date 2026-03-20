import { Link, useLocation } from 'react-router-dom'
import './DashboardSidebar.css'

const DashboardSidebar = ({ isOpen, toggleSidebar, userRole }) => {
  const location = useLocation()

  // Menu items based on user role
  const getMenuItems = () => {
    switch (userRole) {
      case 'admin':
        return [
          { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
          { path: '/admin/users', label: 'Users', icon: '👥' },
          { path: '/admin/farmers', label: 'Farmers', icon: '👨‍🌾' },
          { path: '/admin/products', label: 'Products', icon: '🥬' },
          { path: '/admin/orders', label: 'Orders', icon: '📦' },
          { path: '/admin/reviews', label: 'Reviews', icon: '⭐' },
          { path: '/admin/notifications', label: 'Notifications', icon: '🔔' },
          { path: '/admin/subscriptions', label: 'Subscriptions', icon: '🔄' },
          { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
        ]
      case 'farmer':
        return [
          { path: '/farmer/dashboard', label: 'Dashboard', icon: '📊' },
          { path: '/farmer/products', label: 'My Products', icon: '🥬' },
          { path: '/farmer/orders', label: 'Orders', icon: '📦' },
          { path: '/farmer/reviews', label: 'Reviews', icon: '⭐' },
          { path: '/farmer/analytics', label: 'Analytics', icon: '📈' },
        ]
      case 'consumer':
        return [
          { path: '/consumer/dashboard', label: 'Dashboard', icon: '📊' },
          { path: '/consumer/orders', label: 'My Orders', icon: '📦' },
          { path: '/consumer/subscriptions', label: 'Subscriptions', icon: '🔄' },
          { path: '/consumer/reviews', label: 'My Reviews', icon: '⭐' },
        ]
      default:
        return []
    }
  }

  const menuItems = getMenuItems()

  const isActiveLink = (path) => {
    return location.pathname === path
  }

  return (
    <>
      {isOpen && <div className="dashboard-sidebar-overlay" onClick={toggleSidebar}></div>}
      <nav className={`dashboard-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🌱</span>
            <span className="logo-text">Farm to Table</span>
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <span className="toggle-icon">☰</span>
          </button>
        </div>

        <div className="sidebar-content">
          <div className="user-info">
            <div className="user-avatar">
              <span className="avatar-icon">
                {userRole === 'admin' ? '👨‍💼' : userRole === 'farmer' ? '👨‍🌾' : '👤'}
              </span>
            </div>
            <div className="user-details">
              <span className="user-name">
                {userRole === 'admin' ? 'Administrator' : 
                 userRole === 'farmer' ? 'Farmer' : 'Consumer'}
              </span>
              <span className="user-role">{userRole?.toUpperCase()}</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <ul className="nav-list">
              {menuItems.map((item) => (
                <li key={item.path} className="nav-item">
                  <Link
                    to={item.path}
                    className={`nav-link ${isActiveLink(item.path) ? 'active' : ''}`}
                    onClick={() => {
                      // Close sidebar on mobile after navigation
                      if (window.innerWidth <= 768) {
                        toggleSidebar()
                      }
                    }}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                    {isActiveLink(item.path) && (
                      <span className="nav-indicator"></span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="sidebar-footer">
            <div className="footer-links">
              <Link to="/" className="footer-link">
                <span className="footer-icon">🏠</span>
                <span>Back to Site</span>
              </Link>
              <button className="footer-link logout-btn">
                <span className="footer-icon">🚪</span>
                <span>Logout</span>
              </button>
            </div>
            <div className="app-info">
              <span className="app-version">v1.0.0</span>
              <span className="app-copyright">© 2024 Farm to Table</span>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

export default DashboardSidebar
