import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchFeaturedFarmers } from './homeAPI.js';
import './FeaturedFarmers.css';

const FARM_IMGS = [
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=60&w=500',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=60&w=500',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=60&w=500',
    'https://images.unsplash.com/photo-1595074475009-f2b7b6c2c3c9?auto=format&fit=crop&q=60&w=500',
    'https://images.unsplash.com/photo-1602940659805-770d1b3b9911?auto=format&fit=crop&q=60&w=500',
    'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&q=60&w=500',
];

const FALLBACK_FARMERS = [
    { id: 1, farm_name: 'Green Valley Farms', farming_method: 'Organic', address: 'Pune, Maharashtra', average_rating: 4.8, product_count: 24 },
    { id: 2, farm_name: 'Sunrise Poultry', farming_method: 'Free Range', address: 'Nashik, Maharashtra', average_rating: 4.6, product_count: 12 },
    { id: 3, farm_name: "Nature's Bounty", farming_method: 'Natural Farming', address: 'Satara, Maharashtra', average_rating: 4.9, product_count: 35 },
    { id: 4, farm_name: 'Healthy Harvest Co.', farming_method: 'Hydroponic', address: 'Mumbai, Maharashtra', average_rating: 4.7, product_count: 18 },
];

const FeaturedFarmers = () => {
    const navigate = useNavigate();
    const [farmers, setFarmers] = useState([]);

    useEffect(() => {
        fetchFeaturedFarmers()
            .then(data => setFarmers(data.length > 0 ? data : FALLBACK_FARMERS))
            .catch(() => setFarmers(FALLBACK_FARMERS));
    }, []);

    return (
        <section className="ff-section" aria-label="Featured farmers">
            <div className="ff-container">
                <div className="ff-header">
                    <div>
                        <div className="section-eyebrow">Verified Partners</div>
                        <h2 className="section-title">Featured Farmers</h2>
                        <p className="section-subtitle">Meet the dedicated farmers behind your food</p>
                    </div>
                    <a href="/farmers" className="ff-view-all">All Farmers →</a>
                </div>
                <div className="ff-grid">
                    {farmers.map((farmer, idx) => (
                        <div
                            key={farmer.id || idx}
                            className="ff-card"
                            onClick={() => navigate(`/farmers/${farmer.id}`)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && navigate(`/farmers/${farmer.id}`)}
                        >
                            <div className="ff-card__img-wrap">
                                <img
                                    src={farmer.image_url || FARM_IMGS[idx % FARM_IMGS.length]}
                                    alt={farmer.farm_name}
                                    className="ff-card__img"
                                    loading="lazy"
                                    onError={(e) => { e.target.src = FARM_IMGS[idx % FARM_IMGS.length]; }}
                                />
                                <div className="ff-card__overlay">
                                    <span className="ff-card__view-btn">View Farm →</span>
                                </div>
                                <div className="ff-card__verified">✓ Verified</div>
                            </div>
                            <div className="ff-card__body">
                                <div className="ff-card__top">
                                    <h3 className="ff-card__name">{farmer.farm_name}</h3>
                                    <span className="ff-card__rating">⭐ {Number(farmer.average_rating || 4.5).toFixed(1)}</span>
                                </div>
                                <p className="ff-card__location">📍 {farmer.address || 'Local Farm'}</p>
                                <div className="ff-card__meta">
                                    {farmer.farming_method && (
                                        <span className="ff-card__method">{farmer.farming_method}</span>
                                    )}
                                    <span className="ff-card__products">{farmer.product_count || 0} products</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedFarmers;
