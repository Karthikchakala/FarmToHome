import React from 'react';
import './DashboardCard.css';

const DashboardCard = ({ title, value, icon, trend, colorClass = 'primary' }) => {
    return (
        <div className={`dashboard-card card-${colorClass}`}>
            <div className="card-top">
                <div className="card-info">
                    <h3 className="card-title">{title}</h3>
                    <p className="card-value">{value}</p>
                </div>
                <div className="card-icon-wrapper">
                    <span className="card-icon">{icon}</span>
                </div>
            </div>

            {trend && (
                <div className="card-bottom">
                    <span className={`trend-badge ${trend.isPositive ? 'positive' : 'negative'}`}>
                        {trend.isPositive ? '↑' : '↓'} {trend.value}%
                    </span>
                    <span className="trend-label">vs last month</span>
                </div>
            )}
        </div>
    );
};

export default DashboardCard;
