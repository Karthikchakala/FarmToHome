import React, { useEffect, useState } from 'react';
import api from '../../../utils/axiosConfig.js';
import Loader from '../../../components/Loader/Loader.jsx';
import Button from '../../../components/Button/Button.jsx';
import './Dashboard.css';

const FarmerDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // Fetch profile
                const profileRes = await api.get('/farmers/profile');
                setProfile(profileRes.data);

                // Fetch mock orders for the static UI
                // In a real flow, this would hit GET /orders/farmer
                setOrders([
                    { id: 'ORD-1234', consumer: 'John Doe', total: '₹450', status: 'PLACED', date: '2023-11-20' },
                    { id: 'ORD-1235', consumer: 'Alice Smith', total: '₹800', status: 'CONFIRMED', date: '2023-11-19' }
                ]);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            // Real API implementation
            // await api.put(`/orders/${orderId}/status`, { status: newStatus });
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (_err) {
            alert('Failed to update status');
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="page-wrapper">
            <div className="dashboard-header-container">
                <h1 className="dashboard-header-title">
                    Welcome back, {profile?.farm_name || 'Farmer'}
                </h1>
                <Button variant="primary">Add New Product</Button>
            </div>

            <div className="dashboard-stats-grid">
                <div className="stat-card">
                    <span className="stat-title">Total Sales (This Month)</span>
                    <span className="stat-value">₹12,450</span>
                </div>
                <div className="stat-card">
                    <span className="stat-title">Active Orders</span>
                    <span className="stat-value">8</span>
                </div>
                <div className="stat-card">
                    <span className="stat-title">Products Listed</span>
                    <span className="stat-value">14</span>
                </div>
                <div className="stat-card">
                    <span className="stat-title">Profile Status</span>
                    <span className="stat-value" style={{ color: profile?.is_approved ? 'var(--success)' : 'var(--danger)' }}>
                        {profile?.is_approved ? 'Approved' : 'Pending Verification'}
                    </span>
                </div>
            </div>

            <div className="dashboard-orders-section">
                <h2 style={{ marginBottom: '1rem' }}>Recent Orders</h2>
                <div className="orders-table-wrapper">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Consumer</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td>{order.id}</td>
                                    <td>{order.date}</td>
                                    <td>{order.consumer}</td>
                                    <td>{order.total}</td>
                                    <td>
                                        <span className={`status-badge ${order.status.toLowerCase()}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>
                                        {order.status === 'PLACED' && (
                                            <Button variant="secondary" onClick={() => handleStatusUpdate(order.id, 'CONFIRMED')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Confirm</Button>
                                        )}
                                        {order.status === 'CONFIRMED' && (
                                            <Button variant="primary" onClick={() => handleStatusUpdate(order.id, 'DELIVERED')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Mark Delivered</Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {orders.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No orders yet.</p>}
                </div>
            </div>
        </div>
    );
};

export default FarmerDashboard;
