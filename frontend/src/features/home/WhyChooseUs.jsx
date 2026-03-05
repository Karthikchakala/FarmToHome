import React from 'react';
import './WhyChooseUs.css';

const BENEFITS = [
    {
        icon: '🥬',
        title: 'Farm-Fresh Produce',
        desc: 'Harvested at peak ripeness and delivered within 24 hours — no cold storage, no chemicals.',
        color: '#e8f5e9',
        accent: '#2e7d32',
    },
    {
        icon: '💰',
        title: 'Fair Farmer Pricing',
        desc: 'Farmers earn 2x–4x more by selling directly to you. No middlemen, no exploitation.',
        color: '#fff8e1',
        accent: '#f57f17',
    },
    {
        icon: '🏘️',
        title: 'Local Economy Support',
        desc: 'Every purchase keeps money within your community and strengthens local farming families.',
        color: '#e3f2fd',
        accent: '#1565c0',
    },
    {
        icon: '🌱',
        title: 'Sustainable Farming',
        desc: 'Our farmers use eco-friendly methods — reduced carbon footprint and zero harmful pesticides.',
        color: '#f3e5f5',
        accent: '#6a1b9a',
    },
];

const WhyChooseUs = () => (
    <section className="why" aria-label="Why choose us">
        <div className="why__container">
            <div className="why__header">
                <div className="section-eyebrow">Our Promise</div>
                <h2 className="section-title">Why Buy Directly From Farmers?</h2>
                <p className="section-subtitle">Skip the supply chain. Get better food, support better lives.</p>
            </div>
            <div className="why__grid">
                {BENEFITS.map((b, i) => (
                    <div
                        key={i}
                        className="why-card"
                        style={{ '--why-bg': b.color, '--why-accent': b.accent }}
                    >
                        <div className="why-card__icon-wrap">
                            <span className="why-card__icon">{b.icon}</span>
                        </div>
                        <h3 className="why-card__title">{b.title}</h3>
                        <p className="why-card__desc">{b.desc}</p>
                        <div className="why-card__bar" />
                    </div>
                ))}
            </div>
        </div>
    </section>
);

export default WhyChooseUs;
