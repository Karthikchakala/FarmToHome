import React from 'react';
import { NavLink } from 'react-router-dom';
import './FarmerSidebar.css';

const FarmerSidebar = () => {
    return (
        <aside className="farmer-sidebar">
            <div className="sidebar-header">
                <h2>Farmer Portal</h2>
            </div>

            <nav className="sidebar-nav">
                <NavLink
                    to="/farmer/dashboard"
                    className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                >
                    <span className="nav-icon">📊</span>
                    Dashboard
                </NavLink>

                <NavLink
                    to="/farmer/products"
                    className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                >
                    <span className="nav-icon">📦</span>
                    My Products
                </NavLink>

                <NavLink
                    to="/farmer/orders"
                    className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                >
                    <span className="nav-icon">📋</span>
                    Orders
                </NavLink>

                <NavLink
                    to="/farmer/profile"
                    className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                >
                    <span className="nav-icon">🧑‍🌾</span>
                    Farm Profile
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <p>Farm to Table &copy; 2026</p>
            </div>
        </aside>
    );
};

export default FarmerSidebar;
