import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchHomeConfig } from './homeAPI.js';
import './Subscriptions.css';

const FALLBACK_PLANS = [
    {
        id: 'weekly-veg',
        name: 'Weekly Vegetable Box',
        price: 349,
        period: 'week',
        description: 'Fresh seasonal vegetables delivered weekly',
        contents: ['5 types of vegetables', 'Approx. 3-4 kg', 'Sourced within 50km', 'No pesticides'],
        popular: false,
    },
    {
        id: 'monthly-fruit',
        name: 'Monthly Fruit Basket',
        price: 599,
        period: 'month',
        description: 'Hand-picked seasonal fruits every month',
        contents: ['6 varieties of fruits', 'Approx. 4-5 kg', 'Farm fresh, zero cold-chain', 'Exotic varieties included'],
        popular: true,
    },
    {
        id: 'seasonal-combo',
        name: 'Seasonal Farm Box',
        price: 799,
        period: 'month',
        description: 'Best of farm produce across categories',
        contents: ['Vegetables + Fruits', 'Dairy products', 'Artisan grains or lentils', "Farmer's surprise item"],
        popular: false,
    },
];

const Subscriptions = () => {
    const navigate = useNavigate();
    const [plans, setPlans] = useState(FALLBACK_PLANS);

    useEffect(() => {
        fetchHomeConfig()
            .then(config => { if (config?.subscriptions?.length > 0) setPlans(config.subscriptions); })
            .catch(() => { });
    }, []);

    return (
        <section className="subs" aria-label="Subscription plans">
            <div className="subs__container">
                <div className="subs__header">
                    <div className="section-eyebrow">Subscribe & Save</div>
                    <h2 className="section-title">Farm Subscription Boxes</h2>
                    <p className="section-subtitle">Get fresh produce delivered regularly, straight from the farm to your doorstep</p>
                </div>
                <div className="subs__grid">
                    {plans.map(plan => (
                        <div key={plan.id} className={`subs-card${plan.popular ? ' subs-card--popular' : ''}`}>
                            {plan.popular && <div className="subs-card__badge">🌟 Most Popular</div>}
                            <div className="subs-card__header">
                                <h3 className="subs-card__name">{plan.name}</h3>
                                <p className="subs-card__desc">{plan.description}</p>
                            </div>
                            <div className="subs-card__price-row">
                                <span className="subs-card__currency">₹</span>
                                <span className="subs-card__price">{plan.price}</span>
                                <span className="subs-card__period">/ {plan.period}</span>
                            </div>
                            <ul className="subs-card__contents">
                                {plan.contents.map((item, i) => (
                                    <li key={i} className="subs-card__item">
                                        <span className="subs-card__check">✓</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <button
                                className={`subs-card__btn${plan.popular ? ' subs-card__btn--primary' : ' subs-card__btn--outline'}`}
                                onClick={() => navigate('/register?role=consumer')}
                            >
                                Subscribe Now
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Subscriptions;
