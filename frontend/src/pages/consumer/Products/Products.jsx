import React, { useState, useEffect } from 'react';
import api from '../../../utils/axiosConfig.js';
import Button from '../../../components/Button/Button.jsx';
import Loader from '../../../components/Loader/Loader.jsx';
import './Products.css';

const ConsumerProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [locationStatus, setLocationStatus] = useState('Requesting location...');
    const [locError, setLocError] = useState(false);

    useEffect(() => {
        // Attempt to get user location
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setLocationStatus(`Location acquired. Searching within 7km.`);
                    fetchNearbyProducts(lat, lng);
                },
                (error) => {
                    setLocError(true);
                    setLocationStatus('Location access denied. Please enable to see nearby farmers.');
                    setLoading(false);
                }
            );
        } else {
            setLocError(true);
            setLocationStatus('Geolocation is not supported by your browser');
            setLoading(false);
        }
    }, []);

    const fetchNearbyProducts = async (lat, lng) => {
        try {
            setLoading(true);
            const res = await api.get(`/products/explore?lat=${lat}&lng=${lng}`);
            setProducts(res.data);
        } catch (err) {
            console.error(err);
            setLocError(true);
            setLocationStatus('Failed to load products based on location.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (product) => {
        // Placeholder logic. Cart slice will be integrated later.
        alert(`Added ${product.name} to Cart. Checkout logic pending module 6.`);
    };

    return (
        <div className="products-page-container page-wrapper">
            <div className="products-page-header">
                <h1 className="products-page-title">Explore Nearby Farm Fresh Produce</h1>
                <div className={`location-status ${locError ? 'error' : ''}`}>
                    📍 {locationStatus}
                </div>
            </div>

            {loading ? (
                <Loader />
            ) : products.length > 0 ? (
                <div className="products-grid">
                    {products.map((product) => (
                        <div key={product.id} className="product-card">
                            {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="product-image" />
                            ) : (
                                <div className="product-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '3rem', color: '#ccc' }}>🌾</span>
                                </div>
                            )}

                            <div className="product-details">
                                <h3 className="product-name">{product.name}</h3>
                                <p className="product-farmer">By {product.farmer_name} • {product.farm_name}</p>

                                {product.distance_km && (
                                    <span className="product-distance">
                                        {Number(product.distance_km).toFixed(1)} km away
                                    </span>
                                )}

                                <div className="product-footer">
                                    <span className="product-price">₹{product.price} / {product.unit}</span>
                                    <Button variant="primary" onClick={() => handleAddToCart(product)}>Add</Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <h3>No farmers found nearby</h3>
                    <p>We couldn't find any active farmers selling products within your 7km radius right now.</p>
                </div>
            )}
        </div>
    );
};

export default ConsumerProducts;
