import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice.js';
import Button from '../Button/Button.jsx';
import './Sidebar.css';

const Sidebar = () => {
    const { isAuthenticated, user } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
        setIsOpen(false);
    };

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const closeSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsOpen(false);
        }
    };

    return (
        <>
            <button className="mobile-toggle" onClick={toggleSidebar}>
                ☰ Menu
            </button>

            <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    Farm to Table
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/" className="sidebar-link" onClick={closeSidebar} end>🏠 Home</NavLink>
                    <NavLink to="/products" className="sidebar-link" onClick={closeSidebar}>🛒 Products</NavLink>
                    <NavLink to="/farmers" className="sidebar-link" onClick={closeSidebar}>🧑‍🌾 Farmers</NavLink>

                    {isAuthenticated ? (
                        <>
                            {user?.role === 'consumer' && (
                                <>
                                    <NavLink to="/cart" className="sidebar-link" onClick={closeSidebar}>🛍️ Cart</NavLink>
                                    <NavLink to="/consumer/orders" className="sidebar-link" onClick={closeSidebar}>📦 My Orders</NavLink>
                                    <NavLink to="/consumer/subscriptions" className="sidebar-link" onClick={closeSidebar}>🔁 Subscriptions</NavLink>
                                </>
                            )}
                            {user?.role === 'farmer' && (
                                <>
                                    <NavLink to="/farmer/dashboard" className="sidebar-link" onClick={closeSidebar}>📊 Dashboard</NavLink>
                                    <NavLink to="/farmer/products" className="sidebar-link" onClick={closeSidebar}>🌾 My Products</NavLink>
                                    <NavLink to="/farmer/orders" className="sidebar-link" onClick={closeSidebar}>📋 Orders</NavLink>
                                </>
                            )}
                            {user?.role === 'admin' && (
                                <>
                                    <NavLink to="/admin/dashboard" className="sidebar-link" onClick={closeSidebar}>⚙️ Admin Panel</NavLink>
                                </>
                            )}
                        </>
                    ) : (
                        <NavLink to="/login" className="sidebar-link" onClick={closeSidebar}>🔑 Login / Register</NavLink>
                    )}

                    {isAuthenticated && (
                        <Button variant="danger" className="sidebar-logout-btn" onClick={handleLogout}>
                            Logout
                        </Button>
                    )}
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
