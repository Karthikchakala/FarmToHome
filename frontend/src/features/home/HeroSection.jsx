import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HeroSection.css';

const HeroSection = () => {
    const navigate = useNavigate();

    return (
        <section className="hero" aria-label="Hero banner">
            <div className="hero__bg">
                <div className="hero__bg-overlay" />
                <div className="hero__floating-shapes">
                    <span className="hero__shape hero__shape--1">🌽</span>
                    <span className="hero__shape hero__shape--2">🍅</span>
                    <span className="hero__shape hero__shape--3">🥕</span>
                    <span className="hero__shape hero__shape--4">🌿</span>
                    <span className="hero__shape hero__shape--5">🍃</span>
                    <span className="hero__shape hero__shape--6">🫑</span>
                </div>
            </div>

            <div className="hero__content">
                <div className="hero__text">
                    <div className="hero__badge">
                        <span className="hero__badge-dot" />
                        100% Farm Fresh · No Middlemen
                    </div>
                    <h1 className="hero__title">
                        Fresh Produce Directly<br />
                        <span className="hero__title-accent">From Local Farmers</span>
                    </h1>
                    <p className="hero__subtitle">
                        Buy fresh vegetables, fruits, and dairy directly from farmers near you.
                        Support local agriculture and eat healthier today.
                    </p>
                    <div className="hero__stats">
                        <div className="hero__stat">
                            <span className="hero__stat-value">2,500+</span>
                            <span className="hero__stat-label">Happy Customers</span>
                        </div>
                        <div className="hero__stat-divider" />
                        <div className="hero__stat">
                            <span className="hero__stat-value">350+</span>
                            <span className="hero__stat-label">Local Farmers</span>
                        </div>
                        <div className="hero__stat-divider" />
                        <div className="hero__stat">
                            <span className="hero__stat-value">1,200+</span>
                            <span className="hero__stat-label">Products</span>
                        </div>
                    </div>
                    <div className="hero__cta">
                        <button
                            className="hero__cta-primary"
                            onClick={() => navigate('/products')}
                        >
                            Browse Products
                            <span className="hero__cta-arrow">→</span>
                        </button>
                        <button
                            className="hero__cta-secondary"
                            onClick={() => navigate('/register?role=farmer')}
                        >
                            Become a Farmer
                        </button>
                    </div>
                </div>
                <div className="hero__visual" aria-hidden="true">
                    <div className="hero__image-circle">
                        <img
                            src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600"
                            alt="Farmer in field"
                            className="hero__image"
                            loading="eager"
                        />
                    </div>
                    <div className="hero__badge-float hero__badge-float--top">
                        <span className="hero__badge-float-icon">🚚</span>
                        <div>
                            <div className="hero__badge-float-title">Same Day Delivery</div>
                            <div className="hero__badge-float-sub">Order before 12 PM</div>
                        </div>
                    </div>
                    <div className="hero__badge-float hero__badge-float--bottom">
                        <span className="hero__badge-float-icon">⭐</span>
                        <div>
                            <div className="hero__badge-float-title">4.9/5 Rating</div>
                            <div className="hero__badge-float-sub">From 2500+ reviews</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
