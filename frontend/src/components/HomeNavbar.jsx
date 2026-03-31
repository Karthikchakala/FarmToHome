import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Notifications from './Notifications'
import './HomeNavbar.css'

const HomeNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
    setMobileMenuOpen(false)
  }

  const isActivePath = (path) => {
    return location.pathname === path
  }

  return (
    <nav className={`home-navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="home-navbar-container">
        {/* Logo */}
        <div className="home-navbar-brand">
          <Link to="/" className="brand-link">
            <span className="brand-icon">🌱</span>
            <span className="brand-text">FarmToHome</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="home-navbar-menu">
          <Link 
            to="/" 
            className={`nav-link ${isActivePath('/') ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/products" 
            className={`nav-link ${isActivePath('/products') ? 'active' : ''}`}
          >
            Products
          </Link>
          <Link 
            to="/about" 
            className={`nav-link ${isActivePath('/about') ? 'active' : ''}`}
          >
            About
          </Link>
          <Link 
            to="/services" 
            className={`nav-link ${isActivePath('/services') ? 'active' : ''}`}
          >
            Services
          </Link>
          <Link 
            to="/contact" 
            className={`nav-link ${isActivePath('/contact') ? 'active' : ''}`}
          >
            Contact
          </Link>
        </div>

        {/* Right Side Actions */}
        <div className="home-navbar-actions">
          {user ? (
            <>
              {/* Notifications */}
              <div className="navbar-notifications">
                <Notifications />
              </div>

              {/* User Menu */}
              <div className="user-menu">
                <button 
                  className="user-menu-button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <div className="user-avatar">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="user-name">{user.name}</span>
                  <span className="dropdown-arrow">▼</span>
                </button>

                <div className={`user-dropdown ${mobileMenuOpen ? 'show' : ''}`}>
                  <div className="user-info-header">
                    <div className="user-avatar-large">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="user-details">
                      <div className="user-name-large">{user.name}</div>
                      <div className="user-email">{user.email}</div>
                      <div className="user-role">{user.role}</div>
                    </div>
                  </div>

                  <div className="dropdown-divider"></div>

                  <div className="dropdown-section">
                    <div className="section-title">Quick Actions</div>
                    <Link 
                      to="/cart" 
                      className="dropdown-item"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      🛒 Shopping Cart
                    </Link>
                    <Link 
                      to="/customer/orders" 
                      className="dropdown-item"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      📦 My Orders
                    </Link>
                    {user.role === 'farmer' && (
                      <>
                        <Link 
                          to="/farmer/dashboard" 
                          className="dropdown-item"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          🚜 Farmer Dashboard
                        </Link>
                        <Link 
                          to="/farmer/products" 
                          className="dropdown-item"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          🌾 My Products
                        </Link>
                      </>
                    )}
                    {user.role === 'admin' && (
                      <Link 
                        to="/admin/dashboard" 
                        className="dropdown-item"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        ⚙️ Admin Dashboard
                      </Link>
                    )}
                  </div>

                  <div className="dropdown-section">
                    <div className="section-title">Account</div>
                    <Link 
                      to={`/${user.role}/profile`} 
                      className="dropdown-item"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      👤 Profile Settings
                    </Link>
                    <button 
                      className="dropdown-item logout"
                      onClick={handleLogout}
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Auth Buttons */
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline">
                Sign In
              </Link>
              <Link to="/signup" className="btn btn-primary">
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-nav-menu ${mobileMenuOpen ? 'show' : ''}`}>
        <div className="mobile-nav-content">
          <Link 
            to="/" 
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link 
            to="/products" 
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Products
          </Link>
          <Link 
            to="/about" 
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            About
          </Link>
          <Link 
            to="/services" 
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Services
          </Link>
          <Link 
            to="/contact" 
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact
          </Link>

          {!user && (
            <>
              <div className="mobile-nav-divider"></div>
              <Link 
                to="/login" 
                className="mobile-nav-link mobile-auth"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link 
                to="/signup" 
                className="mobile-nav-link mobile-auth"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div 
          className="mobile-nav-overlay"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}
    </nav>
  )
}

export default HomeNavbar
