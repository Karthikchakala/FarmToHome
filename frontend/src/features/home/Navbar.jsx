import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../auth/authSlice.js';
import './Navbar.css';

const Navbar = () => {
    const { isAuthenticated, user } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
        setMenuOpen(false);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
            <div className="navbar__container">
                {/* Logo */}
                <Link to="/" className="navbar__logo">
                    <span className="navbar__logo-icon">🌾</span>
                    <div className="navbar__logo-text">
                        <span className="navbar__logo-name">Farm to Table</span>
                        <span className="navbar__logo-tagline">Fresh & Local</span>
                    </div>
                </Link>

                {/* Search Bar */}
                <form className="navbar__search" onSubmit={handleSearch}>
                    <span className="navbar__search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search vegetables, fruits, farmers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="navbar__search-input"
                        id="navbar-search"
                        aria-label="Search products"
                    />
                    <button type="submit" className="navbar__search-btn">Search</button>
                </form>

                {/* Desktop Right Actions */}
                <div className="navbar__actions">
                    {isAuthenticated ? (
                        <>
                            <Link to="/cart" className="navbar__icon-btn" aria-label="Cart">
                                <span>🛒</span>
                                <span className="navbar__icon-label">Cart</span>
                            </Link>
                            <div className="navbar__profile-menu">
                                <button className="navbar__profile-btn">
                                    <span>👤</span>
                                    <span>{user?.name?.split(' ')[0] || 'Account'}</span>
                                    <span className="navbar__chevron">▾</span>
                                </button>
                                <div className="navbar__dropdown">
                                    {user?.role === 'consumer' && <Link to="/consumer/dashboard">Dashboard</Link>}
                                    {user?.role === 'farmer' && <Link to="/farmer/dashboard">Dashboard</Link>}
                                    {user?.role === 'admin' && <Link to="/admin/dashboard">Admin Panel</Link>}
                                    <button onClick={handleLogout} className="navbar__dropdown-logout">Logout</button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="navbar__btn navbar__btn--ghost">Login</Link>
                            <Link to="/register" className="navbar__btn navbar__btn--primary">Register</Link>
                        </>
                    )}
                </div>

                {/* Hamburger */}
                <button
                    className={`navbar__hamburger${menuOpen ? ' active' : ''}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                    aria-expanded={menuOpen}
                >
                    <span></span><span></span><span></span>
                </button>
            </div>

            {/* Navigation Links */}
            <nav className="navbar__nav">
                <div className="navbar__nav-container">
                    <NavLink to="/" end className={({ isActive }) => `navbar__nav-link${isActive ? ' active' : ''}`}>Home</NavLink>
                    <NavLink to="/products" className={({ isActive }) => `navbar__nav-link${isActive ? ' active' : ''}`}>Products</NavLink>
                    <NavLink to="/farmers" className={({ isActive }) => `navbar__nav-link${isActive ? ' active' : ''}`}>Farmers</NavLink>
                    <NavLink to="/subscriptions" className={({ isActive }) => `navbar__nav-link${isActive ? ' active' : ''}`}>Subscriptions</NavLink>
                    <NavLink to="/about" className={({ isActive }) => `navbar__nav-link${isActive ? ' active' : ''}`}>About</NavLink>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {menuOpen && (
                <div className="navbar__mobile-menu" role="dialog" aria-modal="true">
                    <form className="navbar__mobile-search" onSubmit={handleSearch}>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit">Go</button>
                    </form>
                    <nav className="navbar__mobile-nav">
                        <NavLink to="/" end onClick={() => setMenuOpen(false)}>🏠 Home</NavLink>
                        <NavLink to="/products" onClick={() => setMenuOpen(false)}>🛒 Products</NavLink>
                        <NavLink to="/farmers" onClick={() => setMenuOpen(false)}>🧑‍🌾 Farmers</NavLink>
                        <NavLink to="/subscriptions" onClick={() => setMenuOpen(false)}>📦 Subscriptions</NavLink>
                        <NavLink to="/about" onClick={() => setMenuOpen(false)}>ℹ️ About</NavLink>
                        {isAuthenticated ? (
                            <>
                                <NavLink to="/cart" onClick={() => setMenuOpen(false)}>🛍️ Cart</NavLink>
                                {user?.role === 'consumer' && <NavLink to="/consumer/dashboard" onClick={() => setMenuOpen(false)}>👤 Dashboard</NavLink>}
                                {user?.role === 'farmer' && <NavLink to="/farmer/dashboard" onClick={() => setMenuOpen(false)}>📊 Dashboard</NavLink>}
                                <button className="navbar__mobile-logout" onClick={handleLogout}>Logout</button>
                            </>
                        ) : (
                            <>
                                <NavLink to="/login" onClick={() => setMenuOpen(false)}>🔑 Login</NavLink>
                                <NavLink to="/register" onClick={() => setMenuOpen(false)}>✏️ Register</NavLink>
                            </>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Navbar;
