import React from 'react';
import { Link } from 'react-router-dom';
import './AuthLayout.css';

/**
 * Shared auth layout — split panel design
 * Left: branding + decorative panel
 * Right: children (form content)
 */
const AuthLayout = ({ children, title, subtitle }) => {
    return (
        <div className="auth-layout">
            {/* Left Branding Panel */}
            <div className="auth-layout__panel">
                <div className="auth-layout__panel-content">
                    <Link to="/" className="auth-layout__logo">
                        <span className="auth-layout__logo-icon">🌾</span>
                        <div>
                            <div className="auth-layout__logo-name">Farm to Table</div>
                            <div className="auth-layout__logo-tagline">Fresh & Local</div>
                        </div>
                    </Link>

                    <div className="auth-layout__panel-text">
                        <h2 className="auth-layout__panel-title">{title}</h2>
                        <p className="auth-layout__panel-sub">{subtitle}</p>
                    </div>

                    {/* Decorative Stats */}
                    <div className="auth-layout__stats">
                        <div className="auth-layout__stat">
                            <span className="auth-layout__stat-val">350+</span>
                            <span className="auth-layout__stat-label">Local Farmers</span>
                        </div>
                        <div className="auth-layout__stat-div" />
                        <div className="auth-layout__stat">
                            <span className="auth-layout__stat-val">2,500+</span>
                            <span className="auth-layout__stat-label">Happy Customers</span>
                        </div>
                        <div className="auth-layout__stat-div" />
                        <div className="auth-layout__stat">
                            <span className="auth-layout__stat-val">7 km</span>
                            <span className="auth-layout__stat-label">Delivery Radius</span>
                        </div>
                    </div>

                    {/* Floating testimonial */}
                    <div className="auth-layout__testimonial">
                        <div className="auth-layout__testimonial-avatar">A</div>
                        <div>
                            <p className="auth-layout__testimonial-text">"Farm to Table changed how I eat. Fresh produce in hours!"</p>
                            <p className="auth-layout__testimonial-author">— Anita S., Regular Customer</p>
                        </div>
                    </div>

                    {/* Floating shapes */}
                    <div className="auth-layout__shapes" aria-hidden="true">
                        <span className="auth-layout__shape auth-layout__shape--1">🥦</span>
                        <span className="auth-layout__shape auth-layout__shape--2">🍅</span>
                        <span className="auth-layout__shape auth-layout__shape--3">🌽</span>
                        <span className="auth-layout__shape auth-layout__shape--4">🥕</span>
                    </div>
                </div>
            </div>

            {/* Right Form Panel */}
            <div className="auth-layout__form-panel">
                <div className="auth-layout__form-wrap">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
