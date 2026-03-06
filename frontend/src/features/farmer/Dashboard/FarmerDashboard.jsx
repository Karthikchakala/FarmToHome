import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats } from './farmerDashboardSlice';
import DashboardCard from '../../../components/farmer/DashboardCard/DashboardCard';
import StockBadge from '../../../components/farmer/StockBadge/StockBadge';
import './FarmerDashboard.css';

const FarmerDashboard = () => {
    const dispatch = useDispatch();
    const { stats, status, error } = useSelector((state) => state.farmerDashboard);

    useEffect(() => {
        dispatch(fetchDashboardStats());
    }, [dispatch]);

    if (status === 'loading') return <div className="farmer-dashboard-loading">Loading Dashboard...</div>;
    if (status === 'failed') return <div className="farmer-dashboard-error">Error: {error}</div>;

    return (
        <div className="farmer-dashboard">
            <header className="dashboard-header">
                <h1>Overview</h1>
                <p>Welcome back! Here's what's happening on your farm.</p>
            </header>

            <div className="dashboard-grid">
                <DashboardCard
                    title="Total Revenue"
                    value={`₹${stats.totalRevenue.toFixed(2)}`}
                    icon="💵"
                    colorClass="success"
                />
                <DashboardCard
                    title="Active Products"
                    value={stats.totalProducts}
                    icon="📦"
                    colorClass="primary"
                />
                <DashboardCard
                    title="Total Orders"
                    value={stats.totalOrders}
                    icon="🛒"
                    colorClass="warning"
                />
                <DashboardCard
                    title="Pending Orders"
                    value={stats.pendingOrders}
                    icon="⏳"
                    colorClass="danger"
                />
            </div>

            <div className="dashboard-content-row">
                <div className="dashboard-panel low-stock-panel">
                    <div className="panel-header">
                        <h2>Low Stock Alerts</h2>
                        <span className="badge-count">{stats.lowStockAlerts?.length || 0}</span>
                    </div>

                    {stats.lowStockAlerts?.length > 0 ? (
                        <ul className="low-stock-list">
                            {stats.lowStockAlerts.map(item => (
                                <li key={item.id} className="low-stock-item">
                                    <div className="item-info">
                                        <span className="item-name">{item.name}</span>
                                        <span className="item-unit">per {item.unit}</span>
                                    </div>
                                    <StockBadge quantity={item.stock_quantity} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="empty-state">
                            <p>All products are sufficiently stocked. Great job!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FarmerDashboard;
