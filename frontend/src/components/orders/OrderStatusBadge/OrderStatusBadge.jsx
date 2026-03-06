import React from 'react';
import './OrderStatusBadge.css';

const OrderStatusBadge = ({ status }) => {
    // Normalizing status to avoid strict exact-case mismatches on legacy entries
    const normalizedStatus = (status || '').toUpperCase();

    const getStatusStyles = () => {
        switch (normalizedStatus) {
            case 'PLACED': return { bg: '#e0e7ff', text: '#4338ca', label: 'Placed' };
            case 'CONFIRMED': return { bg: '#dbeafe', text: '#1d4ed8', label: 'Confirmed' };
            case 'PACKED': return { bg: '#fef08a', text: '#a16207', label: 'Packed' };
            case 'OUT_FOR_DELIVERY': return { bg: '#ffedd5', text: '#c2410c', label: 'Out for Delivery' };
            case 'DELIVERED': return { bg: '#d1fae5', text: '#047857', label: 'Delivered' };
            case 'COMPLETED': return { bg: '#ecfdf5', text: '#065f46', label: 'Completed' };
            case 'CANCELLED': return { bg: '#fee2e2', text: '#b91c1c', label: 'Cancelled' };
            case 'FAILED': return { bg: '#fef2f2', text: '#991b1b', label: 'Failed' };
            case 'DISPUTED': return { bg: '#f3f4f6', text: '#4b5563', label: 'Disputed' };
            default: return { bg: '#f3f4f6', text: '#4b5563', label: status };
        }
    };

    const styleObj = getStatusStyles();

    return (
        <span
            className="status-badge-consumer"
            style={{ backgroundColor: styleObj.bg, color: styleObj.text }}
        >
            {styleObj.label}
        </span>
    );
};

export default OrderStatusBadge;
