import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CTASection.css';

const CTASection = () => {
    const navigate = useNavigate();
    return (
        <section className="cta" aria-label="Farmer call to action">
            <div className="cta__container">
                <div className="cta__content">
                    <div className="cta__icon" aria-hidden="true">🌾</div>
                    <h2 className="cta__title">Are You a Farmer?</h2>
                    <p className="cta__subtitle">
                        Join our platform and sell directly to thousands of consumers.
                        Earn 2x–4x more than traditional wholesale — no middlemen, no exploitation.
                    </p>
                    <div className="cta__perks">
                        <span className="cta__perk">✓ Free to join</span>
                        <span className="cta__perk">✓ Direct payments</span>
                        <span className="cta__perk">✓ Dedicated support</span>
                        <span className="cta__perk">✓ Grow your reach</span>
                    </div>
                    <button
                        className="cta__btn"
                        onClick={() => navigate('/register?role=farmer')}
                    >
                        Start Selling Today →
                    </button>
                </div>
                <div className="cta__visual" aria-hidden="true">
                    <div className="cta__img-wrap">
                        <img
                            src="https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=500"
                            alt="Happy farmer"
                            className="cta__img"
                            loading="lazy"
                        />
                    </div>
                    <div className="cta__floating-stat">
                        <span className="cta__stat-icon">📈</span>
                        <div>
                            <div className="cta__stat-value">4x</div>
                            <div className="cta__stat-label">More income</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTASection;
