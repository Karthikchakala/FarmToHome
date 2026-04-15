import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path)
  const isAssistantActive = isActive('/ai-assistant') || isActive('/farmer/ai-assistant')

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className="navbar farmer-navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/farmer/dashboard" className="brand-link">
            Farm to Table
          </Link>
        </div>

        <nav className="navbar-menu" onClick={closeDropdowns}>
          <div className="nav-section">
            <Link to="/farmer/dashboard" className={`nav-link ${isActive('/farmer/dashboard') ? 'active' : ''}`}>
              Dashboard
            </Link>
          </div>

          <div className="nav-section dropdown-section">
            <button
              className={`nav-link dropdown-toggle ${activeDropdown === 'products' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                toggleDropdown('products')
              }}
            >
              Products
            </button>
            {activeDropdown === 'products' && (
              <div className="dropdown-menu">
                <Link to="/farmer/products" className={`dropdown-item ${isActive('/farmer/products') ? 'active' : ''}`}>My Products</Link>
                <Link to="/farmer/products/add" className={`dropdown-item ${isActive('/farmer/products/add') ? 'active' : ''}`}>Add Product</Link>
                <Link to="/farmer/stock" className={`dropdown-item ${isActive('/farmer/stock') ? 'active' : ''}`}>Stock Management</Link>
              </div>
            )}
          </div>

          <div className="nav-section dropdown-section">
            <button
              className={`nav-link dropdown-toggle ${activeDropdown === 'orders' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                toggleDropdown('orders')
              }}
            >
              Orders
            </button>
            {activeDropdown === 'orders' && (
              <div className="dropdown-menu">
                <Link to="/farmer/orders" className={`dropdown-item ${isActive('/farmer/orders') ? 'active' : ''}`}>Customer Orders</Link>
                <Link to="/farmer/orders/pending" className={`dropdown-item ${isActive('/farmer/orders/pending') ? 'active' : ''}`}>Pending Orders</Link>
                <Link to="/farmer/bulk-orders" className={`dropdown-item ${isActive('/farmer/bulk-orders') ? 'active' : ''}`}>Bulk Orders</Link>
              </div>
            )}
          </div>

          <div className="nav-section">
            <Link to="/farmer/subscriptions" className={`nav-link ${isActive('/farmer/subscriptions') ? 'active' : ''}`}>
              Subscriptions
            </Link>
          </div>

          <div className="nav-section dropdown-section">
            <button
              className={`nav-link dropdown-toggle ${activeDropdown === 'tools' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                toggleDropdown('tools')
              }}
            >
              Smart Tools
            </button>
            {activeDropdown === 'tools' && (
              <div className="dropdown-menu">
                <Link to="/ai-assistant" className={`dropdown-item ${isAssistantActive ? 'active' : ''}`}>AI Assistant</Link>
                <Link to="/farmer/crop-wiki" className={`dropdown-item ${isActive('/farmer/crop-wiki') ? 'active' : ''}`}>Crop Wiki</Link>
                <Link to="/farmer/farming-practices" className={`dropdown-item ${isActive('/farmer/farming-practices') ? 'active' : ''}`}>Farming Practices</Link>
                <Link to="/farmer/pest-scanner" className={`dropdown-item ${isActive('/farmer/pest-scanner') ? 'active' : ''}`}>Pest Scanner</Link>
                <Link to="/farmer/yield-predictor" className={`dropdown-item ${isActive('/farmer/yield-predictor') ? 'active' : ''}`}>Yield Predictor</Link>
                <Link
                  to="/farmer/crop-simulator"
                  className={`dropdown-item ${isActive('/farmer/crop-simulator') || isActive('/farmer/climate-simulator') ? 'active' : ''}`}
                >
                  Crop Simulator
                </Link>
                <Link to="/farmer/crop-monetizer" className={`dropdown-item ${isActive('/farmer/crop-monetizer') ? 'active' : ''}`}>Crop Monetizer</Link>
                <Link to="/farmer/field-management" className={`dropdown-item ${isActive('/farmer/field-management') ? 'active' : ''}`}>My Farm</Link>
                <Link to="/farmer/talk-to-experts" className={`dropdown-item ${isActive('/farmer/talk-to-experts') ? 'active' : ''}`}>Talk to Experts</Link>
              </div>
            )}
          </div>

          <div className="nav-section dropdown-section">
            <button
              className={`nav-link dropdown-toggle ${activeDropdown === 'account' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                toggleDropdown('account')
              }}
            >
              Account
            </button>
            {activeDropdown === 'account' && (
              <div className="dropdown-menu">
                <Link to="/farmer/settings" className={`dropdown-item ${isActive('/farmer/settings') ? 'active' : ''}`}>Settings</Link>
              </div>
            )}
          </div>
        </nav>

        <div className="navbar-actions">
          {showSidebarToggle && (
            <button className="mobile-menu-toggle" onClick={toggleSidebar}>
              Menu
            </button>
          )}
          {isAuthenticated && (
            <>
              <Notifications />
              <div className="user-menu">
                <div className="user-info">
                  <span className="user-name">{user?.name || 'Farmer'}</span>
                  <span className="user-role">{user?.role || 'farmer'}</span>
                </div>
                <div className="dropdown" ref={profileDropdownRef}>
                  <button className="dropdown-toggle" onClick={handleProfileDropdownToggle}>
                    Profile
                  </button>
                  {isProfileDropdownOpen && (
                    <div className="dropdown-menu show">
                      <Link to="/farmer/profile" className="dropdown-item">My Profile</Link>
                      <Link to="/farmer/settings" className="dropdown-item">Settings</Link>
                      <button onClick={handleLogout} className="dropdown-item logout">Logout</button>
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
