import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './ExpertNavbar.css';

const ExpertNavbar = ({ toggleSidebar, showSidebarToggle }) => {
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

  const expertLinks = [
    { to: '/expert/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/expert/consultations', label: 'Appointments', icon: 'chat' },
    { to: '/expert/chat', label: 'Chat', icon: 'message' },
    { to: '/expert/profile', label: 'Profile', icon: 'person' },
  ];

  const getIcon = (iconName) => {
    const icons = {
      dashboard: '📊',
      chat: '📅',
      message: '💬',
      person: '👤'
    };
    return icons[iconName] || '🏠';
  };

  return (
    <nav className="expert-navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h2>Farm to Table</h2>
          <span className="role-badge">Expert</span>
        </div>

        <div className="navbar-menu">
          <ul className="nav-links">
            {expertLinks.map((link) => (
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
              <span className="profile-name">{user?.name}</span>
              <span className="profile-avatar">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="Profile" />
                ) : (
                  <span className="avatar-placeholder">{user?.name?.charAt(0)}</span>
                )}
              </span>
              <span className="dropdown-arrow">▼</span>
            </button>

            {showProfileMenu && (
              <div className="dropdown-menu">
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

export default ExpertNavbar;
