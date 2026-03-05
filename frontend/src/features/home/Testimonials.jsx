import React, { useState, useEffect } from 'react';
import { fetchReviews } from './homeAPI.js';
import './Testimonials.css';

const FALLBACK_REVIEWS = [
    { id: 1, user_name: 'Anita S.', rating: 5, comment: 'Very fresh vegetables and quick delivery. I love supporting my local farmers directly — everything tastes so much better!', product_name: 'Organic Spinach' },
    { id: 2, user_name: 'Ramesh K.', rating: 5, comment: 'The eggs and milk are always top quality. I highly recommend the weekly subscription box — great value for money!', product_name: 'Farm Fresh Eggs' },
    { id: 3, user_name: 'Priya M.', rating: 4, comment: 'Excellent produce. My family switched completely to Farm to Table. The tomatoes have actual flavour unlike supermarket ones.', product_name: 'Cherry Tomatoes' },
    { id: 4, user_name: 'Suresh L.', rating: 5, comment: 'Delivery timing is perfect and the packaging is eco-friendly. Farmers even include handwritten notes — very personal touch!', product_name: 'Seasonal Fruit Box' },
    { id: 5, user_name: 'Divya R.', rating: 4, comment: 'I appreciate knowing exactly which farm my food comes from. Transparency is rare and Farm to Table delivers it beautifully.', product_name: 'Mixed Vegetables' },
];

const Stars = ({ rating }) => (
    <div className="test-stars" aria-label={`${rating} stars`}>
        {[1, 2, 3, 4, 5].map(i => (
            <span key={i} className={i <= rating ? 'test-star test-star--on' : 'test-star'}>★</span>
        ))}
    </div>
);

const AVATAR_COLORS = ['#2e7d32', '#e65100', '#1565c0', '#6a1b9a', '#00695c', '#f57f17'];

const Testimonials = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        fetchReviews()
            .then(data => setReviews(data.length > 0 ? data : FALLBACK_REVIEWS))
            .catch(() => setReviews(FALLBACK_REVIEWS))
            .finally(() => setLoading(false));
    }, []);

    // Auto-rotate carousel
    useEffect(() => {
        if (reviews.length <= 3) return;
        const timer = setInterval(() => setCurrent(c => (c + 1) % reviews.length), 5000);
        return () => clearInterval(timer);
    }, [reviews]);

    const visible = reviews.slice(current, current + 3).concat(
        reviews.slice(0, Math.max(0, 3 - (reviews.length - current)))
    );

    return (
        <section className="testimonials" aria-label="Customer testimonials">
            <div className="testimonials__container">
                <div className="testimonials__header">
                    <div className="section-eyebrow" style={{ color: '#fff', background: 'rgba(255,255,255,0.2)' }}>Customer Love</div>
                    <h2 className="section-title" style={{ color: '#fff' }}>What Our Customers Say</h2>
                    <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.8)' }}>
                        Real reviews from real people who love fresh farm food
                    </p>
                </div>

                {loading ? (
                    <div className="testimonials__grid">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="test-card test-card--skeleton">
                                <div className="skeleton test-skeleton--header" />
                                <div className="skeleton test-skeleton--line" />
                                <div className="skeleton test-skeleton--line" />
                                <div className="skeleton test-skeleton--line test-skeleton--short" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="testimonials__grid">
                            {visible.map((rev, i) => (
                                <div key={rev.id || i} className="test-card">
                                    <div className="test-card__top">
                                        <div
                                            className="test-card__avatar"
                                            style={{ background: AVATAR_COLORS[(rev.id || i) % AVATAR_COLORS.length] }}
                                            aria-hidden="true"
                                        >
                                            {(rev.user_name || 'A')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="test-card__name">{rev.user_name || 'Customer'}</p>
                                            <Stars rating={rev.rating || 5} />
                                        </div>
                                    </div>
                                    <p className="test-card__comment">"{rev.comment}"</p>
                                    {rev.product_name && (
                                        <div className="test-card__product">📦 {rev.product_name}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {reviews.length > 3 && (
                            <div className="testimonials__dots">
                                {reviews.map((_, i) => (
                                    <button
                                        key={i}
                                        className={`testimonials__dot${i === current ? ' testimonials__dot--active' : ''}`}
                                        onClick={() => setCurrent(i)}
                                        aria-label={`Go to review ${i + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
};

export default Testimonials;
