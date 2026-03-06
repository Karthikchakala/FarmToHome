import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchNearbyProducts } from './homeAPI.js';
import './FarmersNearYou.css';

// Group products by farmer
const groupByFarmer = (products) => {
    const map = {};
    products.forEach(p => {
        const key = p.farmer_name || p.farm_name;
        if (!map[key]) {
            map[key] = {
                farmerId: p.farmer_id,
                farmName: p.farm_name,
                farmerName: p.farmer_name,
                location: p.farmer_location || p.address || 'Local farm',
                avgRating: p.avg_rating || 4.5,
                distanceKm: p.distance_km,
                products: [],
            };
        }
        map[key].products.push(p);
    });
    return Object.values(map).slice(0, 6);
};

const StarRating = ({ rating }) => (
    <span className="fny-stars">
        {[1, 2, 3, 4, 5].map(i => (
            <span key={i} className={i <= Math.round(rating) ? 'fny-star fny-star--on' : 'fny-star'}>★</span>
        ))}
        <span className="fny-star-val">{Number(rating || 0).toFixed(1)}</span>
    </span>
);

const FARMER_IMGS = [
    'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=60&w=400',
    'https://images.unsplash.com/photo-1595074475009-f2b7b6c2c3c9?auto=format&fit=crop&q=60&w=400',
    'https://images.unsplash.com/photo-1611174743420-3d7df880ce32?auto=format&fit=crop&q=60&w=400',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=60&w=400',
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=60&w=400',
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=60&w=400',
];

const FarmersNearYou = () => {
    const navigate = useNavigate();
    const [farmers, setFarmers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [locationStatus, setLocationStatus] = useState('idle'); // idle | requesting | granted | denied

    useEffect(() => {
        if (!navigator.geolocation) {
<<<<<<< HEAD
            setTimeout(() => setLocationStatus('denied'), 0);
=======
            setLocationStatus('denied');
>>>>>>> 13e0d502b1d3468218cb5ebbe8d706910030bec4
            return;
        }
        setLocationStatus('requesting');
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setLocationStatus('granted');
                setLoading(true);
                fetchNearbyProducts(coords.latitude, coords.longitude)
                    .then(data => setFarmers(groupByFarmer(Array.isArray(data) ? data : [])))
                    .catch(() => setFarmers([]))
                    .finally(() => setLoading(false));
            },
            () => {
                setLocationStatus('denied');
            },
            { timeout: 8000 }
        );
    }, []);

    return (
        <section className="fny" aria-label="Farmers near you">
            <div className="fny__container">
                <div className="fny__header">
                    <div>
                        <div className="section-eyebrow">Hyperlocal</div>
                        <h2 className="section-title">Farmers Near You</h2>
                        <p className="section-subtitle">Fresh produce from farms within your delivery radius</p>
                    </div>
                    <a href="/farmers" className="fny__view-all">All Farmers →</a>
                </div>

                {locationStatus === 'idle' || locationStatus === 'requesting' ? (
                    <div className="fny__permission-prompt">
                        <div className="fny__prompt-icon">📍</div>
                        <h3>Finding farms near you...</h3>
                        <p>Please allow location access to discover fresh produce from local farmers around you.</p>
                        {locationStatus === 'requesting' && <div className="fny__loader" />}
                    </div>
                ) : locationStatus === 'denied' ? (
                    <div className="fny__permission-prompt fny__permission-prompt--denied">
                        <div className="fny__prompt-icon">🚫</div>
                        <h3>Location access needed</h3>
                        <p>Enable location in your browser to discover farmers near you, or browse all farmers.</p>
                        <button className="fny__browse-btn" onClick={() => navigate('/farmers')}>Browse All Farmers</button>
                    </div>
                ) : loading ? (
                    <div className="fny__grid">
                        {Array(4).fill(0).map((_, i) => (
                            <div key={i} className="fny-card fny-card--skeleton">
                                <div className="skeleton fny-skeleton--img" />
                                <div className="fny-card__body">
                                    <div className="skeleton fny-skeleton--title" />
                                    <div className="skeleton fny-skeleton--line" />
                                    <div className="skeleton fny-skeleton--line fny-skeleton--short" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : farmers.length === 0 ? (
                    <div className="fny__permission-prompt">
                        <div className="fny__prompt-icon">🌾</div>
                        <h3>No farmers found nearby</h3>
                        <p>We're growing! Check back as more farmers join your area, or browse all farmers.</p>
                        <button className="fny__browse-btn" onClick={() => navigate('/farmers')}>Browse All Farmers</button>
                    </div>
                ) : (
                    <div className="fny__grid">
                        {farmers.map((farmer, idx) => (
                            <div
                                key={farmer.farmerId || idx}
                                className="fny-card"
                                onClick={() => farmer.farmerId && navigate(`/farmers/${farmer.farmerId}`)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && farmer.farmerId && navigate(`/farmers/${farmer.farmerId}`)}
                                aria-label={`View ${farmer.farmName} farm`}
                            >
                                <div className="fny-card__img-wrap">
                                    <img
                                        src={FARMER_IMGS[idx % FARMER_IMGS.length]}
                                        alt={farmer.farmName}
                                        className="fny-card__img"
                                        loading="lazy"
                                    />
                                    {farmer.distanceKm && (
                                        <span className="fny-card__distance">📍 {Number(farmer.distanceKm).toFixed(1)} km</span>
                                    )}
                                </div>
                                <div className="fny-card__body">
                                    <h3 className="fny-card__farm-name">{farmer.farmName || farmer.farmerName}</h3>
                                    <p className="fny-card__location">📌 {farmer.location}</p>
                                    <StarRating rating={farmer.avgRating} />
                                    <div className="fny-card__footer">
                                        <span className="fny-card__products">{farmer.products.length} products</span>
                                        <span className="fny-card__link">View Farm →</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default FarmersNearYou;
