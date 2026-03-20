import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Sidebar.css'

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation()
  const { user, logout, isAuthenticated } = useAuth()

  const menuItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/products', label: 'Products', icon: '🥬' },
    { path: '/cart', label: 'Cart', icon: '�' },
    { path: '/subscriptions', label: 'Subscriptions', icon: '🔄' },
    { path: '/orders', label: 'Orders', icon: '📦' },
    { path: '/profile', label: 'Profile', icon: '�' },
    { path: '/services', label: 'Services', icon: '🚚' },
    { path: '/about', label: 'About', icon: 'ℹ️' },
    { path: '/contact', label: 'Contact', icon: '📞' },
  ]

  const handleLogout = () => {
    logout()
    toggleSidebar()
  }

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
      <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>🌱 Farm to Table</h2>
          <button className="sidebar-close" onClick={toggleSidebar}>
            ✕
          </button>
        </div>
        
        {isAuthenticated && (
          <div className="sidebar-user">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-role">{user?.role || 'Customer'}</div>
            </div>
          </div>
        )}
        
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={toggleSidebar}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-text">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          {isAuthenticated ? (
            <button className="btn btn-danger btn-small" onClick={handleLogout}>
              🚪 Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-small" onClick={toggleSidebar}>
                🤝 Login
              </Link>
              <Link to="/signup" className="btn btn-primary btn-small" onClick={toggleSidebar}>
                📝 Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </>
  )
}

export default Sidebar
