import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CategorySection.css';

const CATEGORIES = [
    { id: 'vegetables', name: 'Vegetables', icon: '🥦', desc: '120+ varieties', bg: '#e8f5e9', accent: '#2e7d32' },
    { id: 'fruits', name: 'Fruits', icon: '🍎', desc: '80+ varieties', bg: '#fff3e0', accent: '#e65100' },
    { id: 'dairy', name: 'Dairy', icon: '🥛', desc: 'Fresh daily', bg: '#e3f2fd', accent: '#1565c0' },
    { id: 'grains', name: 'Grains & Pulses', icon: '🌾', desc: '60+ varieties', bg: '#fffde7', accent: '#f57f17' },
    { id: 'organic', name: 'Organic Produce', icon: '🌿', desc: 'Certified organic', bg: '#e0f2f1', accent: '#00695c' },
    { id: 'herbs', name: 'Herbs & Spices', icon: '🌱', desc: '50+ varieties', bg: '#f3e5f5', accent: '#6a1b9a' },
];

const CategorySection = () => {
    const navigate = useNavigate();

    return (
        <section className="categories" aria-label="Product categories">
            <div className="categories__container">
                <div className="categories__header">
                    <div className="section-eyebrow">Shop by Category</div>
                    <h2 className="section-title">What are you looking for?</h2>
                    <p className="section-subtitle">Explore our wide range of fresh, farm-sourced products</p>
                </div>
                <div className="categories__grid">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            className="cat-card"
                            onClick={() => navigate(`/products?category=${cat.id}`)}
                            aria-label={`Browse ${cat.name}`}
                            style={{ '--cat-bg': cat.bg, '--cat-accent': cat.accent }}
                        >
                            <div className="cat-card__icon-wrap">
                                <span className="cat-card__icon">{cat.icon}</span>
                            </div>
                            <h3 className="cat-card__name">{cat.name}</h3>
                            <span className="cat-card__desc">{cat.desc}</span>
                            <span className="cat-card__arrow">→</span>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CategorySection;
