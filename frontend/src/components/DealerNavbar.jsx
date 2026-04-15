import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './DealerNavbar.css';

const DealerNavbar = ({ toggleSidebar, showSidebarToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActiveRoute = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const dealerLinks = [
    { to: '/dealer/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/dealer/farmers', label: 'Browse Farmers', icon: 'people' },
    { to: '/dealer/bulk-orders', label: 'Bulk Orders', icon: 'shopping_cart' },
    { to: '/dealer/analytics', label: 'Analytics', icon: 'analytics' },
    { to: '/dealer/messages', label: 'Messages', icon: 'message' },
    { to: '/dealer/profile', label: 'Profile', icon: 'person' },
  ];

  const getIcon = (iconName) => {
    const icons = {
      dashboard: '📊',
      people: '👨‍🌾',
      shopping_cart: '🛒',
      analytics: '📈',
      message: '💬',
      person: '👤'
    };
    return icons[iconName] || '🏠';
  };

  return (
    <nav className="dealer-navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h2>Farm to Table</h2>
          <span className="role-badge">Dealer</span>
        </div>

        <div className="navbar-menu">
          <ul className="nav-links">
            {dealerLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`nav-link ${isActiveRoute(link.to) ? 'active' : ''}`}
                >
                  <span className="nav-icon">{getIcon(link.icon)}</span>
                  <span className="nav-label">{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="navbar-actions">
          {showSidebarToggle && (
            <button className="sidebar-toggle" onClick={toggleSidebar}>
              <span className="menu-icon">menu</span>
            </button>
          )}

          <div className="profile-dropdown">
            <button
              className="profile-button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <span className="profile-name">{user?.name || 'User'}</span>
              <span className="profile-avatar">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="Profile" />
                ) : (
                  <span className="avatar-placeholder">{user?.name?.charAt(0) || 'U'}</span>
                )}
              </span>
              <span className="dropdown-arrow">▼</span>
            </button>

            {showProfileMenu && (
              <div className="dropdown-menu" style={{ display: 'block', visibility: 'visible', opacity: '1' }}>
                <button onClick={handleLogout} className="dropdown-item logout">
                  <span className="item-icon">🚪</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DealerNavbar;
