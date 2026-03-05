import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchFeaturedProducts } from './homeAPI.js';
import './FeaturedProducts.css';

const StarRating = ({ rating }) => {
    const stars = Math.round(rating || 0);
    return (
        <span className="star-rating" aria-label={`${rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map(i => (
                <span key={i} className={i <= stars ? 'star star--filled' : 'star'}>★</span>
            ))}
            <span className="star-count">({rating ? Number(rating).toFixed(1) : '0.0'})</span>
        </span>
    );
};

const SkeletonCard = () => (
    <div className="product-card product-card--skeleton">
        <div className="skeleton skeleton--img" />
        <div className="product-card__body">
            <div className="skeleton skeleton--line skeleton--short" />
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line skeleton--medium" />
            <div className="skeleton skeleton--bottom" />
        </div>
    </div>
);

const FeaturedProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchFeaturedProducts()
            .then(data => setProducts(data))
            .catch(() => setError('Unable to load products'))
            .finally(() => setLoading(false));
    }, []);

    const handleAddToCart = (product) => {
        // Dispatch to cart or navigate to login
        alert(`Added ${product.name} to cart (cart integration pending)`);
    };

    return (
        <section className="featured-products" aria-label="Featured products">
            <div className="featured-products__container">
                <div className="featured-products__header">
                    <div>
                        <div className="section-eyebrow">Hand Picked For You</div>
                        <h2 className="section-title">Featured Products</h2>
                        <p className="section-subtitle">Top rated produce from our verified farmers</p>
                    </div>
                    <a href="/products" className="featured-products__view-all">View All →</a>
                </div>

                {error && (
                    <div className="featured-products__error">
                        <span>🌾</span>
                        <p>{error}. Please check back soon!</p>
                    </div>
                )}

                <div className="featured-products__scroll-wrap">
                    <div className="featured-products__grid">
                        {loading
                            ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
                            : products.length > 0
                                ? products.map(product => (
                                    <div key={product.id} className="product-card">
                                        <div className="product-card__img-wrap">
                                            <img
                                                src={product.image_url || `https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=60&w=400`}
                                                alt={product.name}
                                                className="product-card__img"
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=60&w=400';
                                                }}
                                            />
                                            <span className="product-card__category-badge">{product.category || 'Fresh'}</span>
                                        </div>
                                        <div className="product-card__body">
                                            <p className="product-card__farmer">🧑‍🌾 {product.farm_name || product.farmer_name || 'Local Farmer'}</p>
                                            <h3 className="product-card__name">{product.name}</h3>
                                            <StarRating rating={product.avg_rating} />
                                            <div className="product-card__footer">
                                                <div className="product-card__price">
                                                    <span className="product-card__price-amount">₹{Number(product.price).toFixed(0)}</span>
                                                    <span className="product-card__price-unit">/ {product.unit || 'kg'}</span>
                                                </div>
                                                <button
                                                    className="product-card__add-btn"
                                                    onClick={() => handleAddToCart(product)}
                                                    aria-label={`Add ${product.name} to cart`}
                                                >
                                                    + Cart
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                                : !error && (
                                    <div className="featured-products__empty">
                                        <span>🌱</span>
                                        <p>Products are being loaded from our farms. Check back soon!</p>
                                    </div>
                                )
                        }
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeaturedProducts;
