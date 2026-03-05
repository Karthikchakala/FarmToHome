import React from 'react';

const StockBadge = ({ quantity }) => {
    let statusClass = '';
    let label = '';

    if (quantity <= 0) {
        statusClass = 'out-of-stock';
        label = 'Out of Stock';
    } else if (quantity <= 5) {
        statusClass = 'low-stock';
        label = 'Low Stock';
    } else {
        statusClass = 'in-stock';
        label = 'In Stock';
    }

    return (
        <span className={`stock-badge ${statusClass}`} style={{
            padding: '4px 10px',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: '600',
            display: 'inline-block'
        }}>
            {label} ({quantity})
        </span>
    );
};

export default StockBadge;
