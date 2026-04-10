import { useState, useContext, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Notifications from './Notifications'
import './FarmerNavbar.css'

const FarmerNavbar = ({ showSidebarToggle = true, toggleSidebar }) => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const profileDropdownRef = useRef(null)

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleDropdown = (section) => {
    setActiveDropdown(activeDropdown === section ? null : section)
  }

  const closeDropdowns = () => {
    setActiveDropdown(null)
    setIsProfileDropdownOpen(false)
  }

  const handleProfileDropdownToggle = (e) => {
    e.stopPropagation()
    setIsProfileDropdownOpen(!isProfileDropdownOpen)
    setActiveDropdown(null)
  }

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/farmer/dashboard" className="brand-link">
            🌾 Farm to Table
          </Link>
        </div>

        <div className="navbar-actions">
          {showSidebarToggle && (
            <button className="mobile-menu-toggle" onClick={toggleSidebar}>
              ☰
            </button>
          )}
        </div>

        <nav className="navbar-menu" onClick={closeDropdowns}>
          {/* Dashboard - Single item */}
          <div className="nav-section">
            <Link 
              to="/farmer/dashboard" 
              className={`nav-link ${isActive('/farmer/dashboard') ? 'active' : ''}`}
            >
              📊 Dashboard
            </Link>
          </div>

          {/* Products - Dropdown */}
          <div className="nav-section dropdown-section">
            <button 
              className={`nav-link dropdown-toggle ${activeDropdown === 'products' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                toggleDropdown('products')
              }}
            >
              🌾 Products ▼
            </button>
            {activeDropdown === 'products' && (
              <div className="dropdown-menu">
                <Link 
                  to="/farmer/products" 
                  className={`dropdown-item ${isActive('/farmer/products') ? 'active' : ''}`}
                >
                  🌾 My Products
                </Link>
                <Link 
                  to="/farmer/products/add" 
                  className={`dropdown-item ${isActive('/farmer/products/add') ? 'active' : ''}`}
                >
                  ➕ Add Product
                </Link>
                <Link 
                  to="/farmer/stock" 
                  className={`dropdown-item ${isActive('/farmer/stock') ? 'active' : ''}`}
                >
                  📦 Stock Management
                </Link>
              </div>
            )}
          </div>

          {/* Orders - Dropdown */}
          <div className="nav-section dropdown-section">
            <button 
              className={`nav-link dropdown-toggle ${activeDropdown === 'orders' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                toggleDropdown('orders')
              }}
            >
              📋 Orders ▼
            </button>
            {activeDropdown === 'orders' && (
              <div className="dropdown-menu">
                <Link 
                  to="/farmer/orders" 
                  className={`dropdown-item ${isActive('/farmer/orders') ? 'active' : ''}`}
                >
                  📋 Customer Orders
                </Link>
                <Link 
                  to="/farmer/orders/pending" 
                  className={`dropdown-item ${isActive('/farmer/orders/pending') ? 'active' : ''}`}
                >
                  ⏳ Pending Orders
                </Link>
              </div>
            )}
          </div>

          {/* Subscriptions - Single item */}
          <div className="nav-section">
            <Link 
              to="/farmer/subscriptions" 
              className={`nav-link ${isActive('/farmer/subscriptions') ? 'active' : ''}`}
            >
              🔄 Subscriptions
            </Link>
          </div>

          {/* Account - Dropdown */}
          <div className="nav-section dropdown-section">
            <button 
              className={`nav-link dropdown-toggle ${activeDropdown === 'account' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                toggleDropdown('account')
              }}
            >
              👤 Account ▼
            </button>
            {activeDropdown === 'account' && (
              <div className="dropdown-menu">
                <Link 
                  to="/farmer/settings" 
                  className={`dropdown-item ${isActive('/farmer/settings') ? 'active' : ''}`}
                >
                  ⚙️ Settings
                </Link>
              </div>
            )}
          </div>
        </nav>

        <div className="navbar-actions">
          {isAuthenticated && (
            <>
              <Notifications />
              <div className="user-menu">
                <div className="user-info">
                  <span className="user-name">
                    🌾 {user?.name || 'Farmer'}
                  </span>
                  <span className="user-role">{user?.role || 'Farmer'}</span>
                </div>
                <div className="dropdown" ref={profileDropdownRef}>
                  <button 
                    className="dropdown-toggle" 
                    onClick={handleProfileDropdownToggle}
                  >
                    ▼
                  </button>
                  {isProfileDropdownOpen && (
                    <div className="dropdown-menu show">
                      <Link to="/farmer/profile" className="dropdown-item">
                        👤 My Profile
                      </Link>
                      <Link to="/farmer/settings" className="dropdown-item">
                        ⚙️ Settings
                      </Link>
                      <button onClick={handleLogout} className="dropdown-item logout">
                        🚪 Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default FarmerNavbar
