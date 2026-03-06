import React from 'react';
import './HowItWorks.css';

const STEPS = [
    {
        num: '01',
        icon: '📍',
        title: 'Discover Farmers Near You',
        desc: 'Share your location to find verified farmers within your delivery radius.',
    },
    {
        num: '02',
        icon: '🥦',
        title: 'Choose Fresh Produce',
        desc: 'Browse seasonal vegetables, fruits, dairy and more — all harvested fresh.',
    },
    {
        num: '03',
        icon: '🛒',
        title: 'Place Your Order',
        desc: 'Add items to cart, choose your delivery slot, and complete payment securely.',
    },
    {
        num: '04',
        icon: '🚚',
        title: 'Get Doorstep Delivery',
        desc: 'Receive farm-fresh produce at your door — often within hours of harvest.',
    },
];

const HowItWorks = () => (
    <section className="hiw" aria-label="How it works">
        <div className="hiw__container">
            <div className="hiw__header">
                <div className="section-eyebrow">Simple Process</div>
                <h2 className="section-title">How It Works</h2>
                <p className="section-subtitle">From farm to your table in 4 easy steps</p>
            </div>
            <div className="hiw__steps">
                {STEPS.map((step, i) => (
                    <React.Fragment key={step.num}>
                        <div className="hiw-step">
                            <div className="hiw-step__icon-wrap">
                                <span className="hiw-step__num">{step.num}</span>
                                <span className="hiw-step__icon">{step.icon}</span>
                            </div>
                            <h3 className="hiw-step__title">{step.title}</h3>
                            <p className="hiw-step__desc">{step.desc}</p>
                        </div>
                        {i < STEPS.length - 1 && <div className="hiw__connector" aria-hidden="true">---→</div>}
                    </React.Fragment>
                ))}
            </div>
        </div>
    </section>
);

export default HowItWorks;
