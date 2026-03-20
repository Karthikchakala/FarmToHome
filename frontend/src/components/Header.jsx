import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Header.css'

const Header = ({ toggleSidebar, showSidebarToggle }) => {
  const { user, logout, isAuthenticated } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          {showSidebarToggle && (
            <button className="menu-toggle" onClick={toggleSidebar}>
              ☰
            </button>
          )}
          
          <div className="header-logo">
            <Link to="/" className="logo-link">
              <h1>🌱 Farm to Table</h1>
            </Link>
          </div>

          <nav className="header-nav">
            {/* General navigation for all users */}
            <Link to="/products">Products</Link>
            <Link to="/services">Services</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            
            {/* Customer-specific navigation when authenticated */}
            {isAuthenticated && user?.role === 'consumer' && (
              <>
                <Link to="/profile">Profile</Link>
                <Link to="/orders">Orders</Link>
                <Link to="/cart">🛒 Cart</Link>
                <Link to="/subscriptions">Subscriptions</Link>
                <Link to="/reviews">My Reviews</Link>
              </>
            )}
          </nav>

          <div className="header-actions">
            {isAuthenticated ? (
              <div className="user-menu">
                <div className="user-info">
                  <span className="user-name">{user?.name || 'User'}</span>
                  <span className="user-role">{user?.role || 'Customer'}</span>
                </div>
                <button className="btn btn-danger btn-small" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline btn-small">🤝 Login</Link>
                <Link to="/signup" className="btn btn-primary btn-small">📝 Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
