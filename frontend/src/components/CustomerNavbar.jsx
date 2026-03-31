import { useState, useContext, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Notifications from './Notifications_simple'
import './CustomerNavbar.css'

const CustomerNavbar = ({ showSidebarToggle = true, toggleSidebar }) => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState(null)
  const dropdownRef = useRef(null)

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen)
    setOpenSubmenu(null) // Close submenus when toggling main dropdown
  }

  const handleDropdownClose = () => {
    setIsDropdownOpen(false)
    setOpenSubmenu(null)
  }

  const toggleSubmenu = (menu) => {
    setOpenSubmenu(openSubmenu === menu ? null : menu)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
        setOpenSubmenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Define menu structure based on user role
  const getMenuStructure = () => {
    if (user?.role === 'admin') {
      return [
        {
          title: '📊 Dashboard',
          children: [
            { title: 'Admin Dashboard', link: '/admin/dashboard' }
          ]
        },
        {
          title: '👥 Management',
          children: [
            { title: 'User Management', link: '/admin/users' },
            { title: 'Farmer Management', link: '/admin/farmers' },
            { title: 'Order Management', link: '/admin/orders' },
            { title: 'Product Management', link: '/admin/products' }
          ]
        },
        {
          title: '📈 Analytics',
          children: [
            { title: 'Analytics Dashboard', link: '/admin/analytics' }
          ]
        },
        {
          title: '⚙️ Account',
          children: [
            { title: 'Settings', link: '/admin/settings' }
          ]
        }
      ]
    } else if (user?.role === 'farmer') {
      return [
        {
          title: '📊 Dashboard',
          children: [
            { title: 'Farmer Dashboard', link: '/farmer/dashboard' }
          ]
        },
        {
          title: '🥬 Products',
          children: [
            { title: 'My Products', link: '/farmer/products' },
            { title: 'Stock Management', link: '/farmer/stock' }
          ]
        },
        {
          title: '📦 Orders',
          children: [
            { title: 'Customer Orders', link: '/farmer/orders' }
          ]
        },
        {
          title: '🔄 Subscriptions',
          children: [
            { title: 'Manage Subscriptions', link: '/farmer/subscriptions' }
          ]
        },
        {
          title: '⭐ Reviews',
          children: [
            { title: 'Customer Reviews', link: '/farmer/reviews' }
          ]
        },
        {
          title: '📈 Analytics',
          children: [
            { title: 'Sales Analytics', link: '/farmer/analytics' }
          ]
        },
        {
          title: '👤 Account',
          children: [
            { title: 'My Profile', link: '/farmer/profile' }
          ]
        }
      ]
    } else {
      return [
        {
          title: '📊 Dashboard',
          children: [
            { title: 'Customer Dashboard', link: '/customer/dashboard' }
          ]
        },
        {
          title: '🛒 Orders',
          children: [
            { title: 'My Orders', link: '/customer/orders' },
            { title: 'Shopping Cart', link: '/cart' }
          ]
        },
        {
          title: '🔄 Subscriptions',
          children: [
            { title: 'My Subscriptions', link: '/customer/subscriptions' }
          ]
        },
        {
          title: '⭐ Reviews',
          children: [
            { title: 'My Reviews', link: '/customer/reviews' }
          ]
        },
        {
          title: '� Feedback',
          children: [
            { title: 'Submit Feedback', link: '/customer/feedback' }
          ]
        },
        {
          title: '�👤 Account',
          children: [
            { title: 'My Profile', link: '/customer/profile' }
          ]
        }
      ]
    }
  }

  const menuStructure = getMenuStructure()

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          {showSidebarToggle && (
            <button className="mobile-menu-toggle" onClick={toggleSidebar}>
              ☰
            </button>
          )}
          
          <nav className="navbar-menu">
            <div className="navbar-main">
              <div className="navbar-brand">
                <Link to="/" className="brand-link">
                  🌱 Farm to Table
                </Link>
              </div>
              
              <div className="nav-links-container">
                <ul className="nav-links-main">
                  <li>
                    <Link to="/customer/products">🥬 Products</Link>
                  </li>
                  <li>
                    <Link to="/customer/dashboard">📊 Dashboard</Link>
                  </li>
                  <li>
                    <Link to="/customer/orders">🛒 Orders</Link>
                  </li>
                  <li>
                    <Link to="/customer/subscriptions">🔄 Subscriptions</Link>
                  </li>
                  <li>
                    <Link to="/customer/reviews">⭐ Reviews</Link>
                  </li>
                  <li>
                    <Link to="/customer/feedback">📝 Feedback</Link>
                  </li>
                  <li>
                    <Link to="/customer/profile">👤 Profile</Link>
                  </li>
                </ul>
              </div>
              
              <div className="nav-auth">
                {!isAuthenticated ? (
                  <ul className="nav-links-auth">
                    <li>
                      <Link to="/login">Login</Link>
                    </li>
                    <li>
                      <Link to="/signup">Signup</Link>
                    </li>
                  </ul>
                ) : (
                  <>
                    <div className="user-menu">
                      <Notifications />
                      <div className="user-profile-dropdown" ref={dropdownRef}>
                        <button 
                          className="profile-toggle" 
                          onClick={handleDropdownToggle}
                        >
                          <div className="user-info">
                            <span className="user-name">
                               {user?.name || 'User'}
                            </span>
                            <span className="user-role">{user?.role || 'Customer'}</span>
                          </div>
                          <span className="dropdown-arrow">▼</span>
                        </button>
                        {isDropdownOpen && (
                          <div className="dropdown-menu show">
                            <button 
                              onClick={() => { 
                                logout(); 
                                navigate('/');
                                handleDropdownClose(); 
                              }} className="dropdown-item logout"
                            >
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
        </div>
      </div>
    </header>
  )
}

export default CustomerNavbar
