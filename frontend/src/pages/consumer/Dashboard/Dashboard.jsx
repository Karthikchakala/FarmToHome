import React, { useEffect, useState } from 'react';
import api from '../../../utils/axiosConfig.js';
import Loader from '../../../components/Loader/Loader.jsx';
import Button from '../../../components/Button/Button.jsx';
import './Dashboard.css';

const ConsumerDashboard = () => {
    const [walletBalance, setWalletBalance] = useState(0);
    const [subscriptions, setSubscriptions] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConsumerData = async () => {
            try {
                setLoading(true);
                // Using mock integration for the dashboard features
                const [walletRes, subsRes] = await Promise.all([
                    api.get('/support/wallet').catch(() => ({ data: { balance: '500.00' } })),
                    api.get('/support/subscriptions').catch(() => ({
                        data: [
                            { id: 1, product_name: 'Organic Milk 1L', farm_name: 'Sunny Dairy', frequency: 'daily', next_delivery_date: '2023-11-22' }
                        ]
                    }))
                ]);

                setWalletBalance(walletRes.data.balance);
                setSubscriptions(subsRes.data);

                // Mock recent order history
                setOrders([
                    { id: 'ORD-54321', total: '₹340.00', date: '2023-11-18', status: 'DELIVERED', farmer: 'Green Field Organics' },
                    { id: 'ORD-54320', total: '₹120.00', date: '2023-11-15', status: 'COMPLETED', farmer: 'Sunrise Poultry' }
                ]);

            } catch (err) {
                console.error('Error fetching consumer dashboard stats', err);
            } finally {
                setLoading(false);
            }
        };

        fetchConsumerData();
    }, []);

    const handleTopUp = async () => {
        try {
            await api.post('/support/wallet/topup', { amount: 1000 });
            alert('Wallet topped up with ₹1000!');
            setWalletBalance(prev => parseFloat(prev) + 1000);
        } catch (_e) {
            alert('Top up integration is pending');
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="page-wrapper">
            <div className="consumer-dashboard-header">
                <h1 className="consumer-dashboard-title">My Account</h1>
                <div className="wallet-badge">
                    👛 Wallet Balance: ₹{parseFloat(walletBalance).toFixed(2)}
                    <Button variant="secondary" onClick={handleTopUp} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                        Add Funds
                    </Button>
                </div>
            </div>

            <div className="dashboard-sections-grid">
                <div className="dashboard-section">
                    <h2 className="section-header-title">Active Subscriptions</h2>
                    {subscriptions.length === 0 ? (
                        <p style={{ color: 'var(--text-light)' }}>You don't have any active subscriptions.</p>
                    ) : (
                        subscriptions.map(sub => (
                            <div key={sub.id} className="subscription-card">
                                <div>
                                    <div className="sub-product">{sub.product_name}</div>
                                    <div className="sub-details">From: {sub.farm_name}</div>
                                    <div className="sub-details">Next Delivery: {new Date(sub.next_delivery_date).toLocaleDateString()}</div>
                                </div>
                                <div className="sub-freq-badge">{sub.frequency.toUpperCase()}</div>
                            </div>
                        ))
                    )}
                    <Button variant="primary" style={{ marginTop: '1rem', width: '100%' }}>Explore Subscription Plans</Button>
                </div>

                <div className="dashboard-section">
                    <h2 className="section-header-title">Recent Order History</h2>
                    {orders.length === 0 ? (
                        <p style={{ color: 'var(--text-light)' }}>No past orders found.</p>
                    ) : (
                        <div>
                            {orders.map(order => (
                                <div key={order.id} className="order-history-item">
                                    <div className="order-details-left">
                                        <h4>{order.id}</h4>
                                        <span>{order.date} • {order.farmer}</span>
                                    </div>
                                    <div className="order-details-right">
                                        <span style={{ fontWeight: 'bold' }}>Total: {order.total}</span>
                                        <span style={{ fontSize: '0.8rem', color: order.status === 'DELIVERED' || order.status === 'COMPLETED' ? 'var(--success)' : 'var(--text-light)' }}>
                                            {order.status}
                                        </span>
                                        {(order.status === 'DELIVERED' || order.status === 'COMPLETED') && (
                                            <button className="review-btn">Write a Review</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConsumerDashboard;
