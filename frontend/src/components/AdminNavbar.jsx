import { useState, useContext, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Navbar.css'

const AdminNavbar = ({ showSidebarToggle = true, toggleSidebar }) => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const handleDropdownClose = () => {
    setIsDropdownOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/admin/dashboard" className="brand-link">
            ⚙️ FarmFresh Admin
          </Link>
        </div>

        <div className="navbar-menu">
          <div className="nav-section">
            <span className="nav-section-title">Dashboard</span>
            <ul className="nav-links">
              <li>
                <Link 
                  to="/admin/dashboard" 
                  className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
                >
                  📊 Overview
                </Link>
              </li>
            </ul>
          </div>

          <div className="nav-section">
            <span className="nav-section-title">Management</span>
            <ul className="nav-links">
              <li>
                <Link 
                  to="/admin/users" 
                  className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`}
                >
                  👥 Users
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin/products" 
                  className={`nav-link ${isActive('/admin/products') ? 'active' : ''}`}
                >
                  🌾 Products
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin/orders" 
                  className={`nav-link ${isActive('/admin/orders') ? 'active' : ''}`}
                >
                  📋 Orders
                </Link>
              </li>
            </ul>
          </div>

          <div className="nav-section">
            <span className="nav-section-title">System</span>
            <ul className="nav-links">
              <li>
                <Link 
                  to="/admin/analytics" 
                  className={`nav-link ${isActive('/admin/analytics') ? 'active' : ''}`}
                >
                  📈 Analytics
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin/settings" 
                  className={`nav-link ${isActive('/admin/settings') ? 'active' : ''}`}
                >
                  ⚙️ Settings
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="navbar-actions">
          {isAuthenticated && (
            <div className="user-menu">
              <span className="user-name">
                ⚙️ {user?.name?.split(' ')[0] || 'Admin'}
              </span>
              <div className="dropdown" ref={dropdownRef}>
                <button 
                  className="dropdown-toggle" 
                  onClick={handleDropdownToggle}
                >
                  ▼
                </button>
                {isDropdownOpen && (
                  <div className="dropdown-menu show">
                    <Link to="/admin/dashboard" className="dropdown-item">
                      📊 Admin Dashboard
                    </Link>
                    <Link to="/admin/settings" className="dropdown-item">
                      ⚙️ Admin Settings
                    </Link>
                    <button onClick={() => { 
                      handleLogout(); 
                      handleDropdownClose(); 
                    }} className="dropdown-item logout">
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default AdminNavbar
