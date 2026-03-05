import React, { useState } from 'react';
import './OrderRow.css';

const ORDER_STATUS_FLOW = {
    'PLACED': ['CONFIRMED'],
    'CONFIRMED': ['PACKED'],
    'PACKED': ['OUT_FOR_DELIVERY'],
    'OUT_FOR_DELIVERY': ['DELIVERED'],
    'DELIVERED': [],
    'COMPLETED': [],
    'CANCELLED': []
};

const OrderRow = ({ order, onUpdateStatus }) => {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusUpdate = async (newStatus) => {
        setIsUpdating(true);
        await onUpdateStatus(order.order_id, newStatus);
        setIsUpdating(false);
    };

    const nextAllowedStatuses = ORDER_STATUS_FLOW[order.status] || [];

    // Status Badge Styling logic
    const getStatusClass = (status) => {
        switch (status) {
            case 'PLACED': return 'status-placed';
            case 'CONFIRMED': return 'status-confirmed';
            case 'PACKED': return 'status-packed';
            case 'OUT_FOR_DELIVERY': return 'status-out';
            case 'DELIVERED': return 'status-delivered';
            case 'COMPLETED': return 'status-completed';
            default: return 'status-default';
        }
    };

    return (
        <div className="order-row-container">
            <div className="order-header-row">
                <div className="order-meta">
                    <span className="order-id">Order ID: #{order.order_id.toString().slice(-6)}</span>
                    <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className="order-status-wrapper">
                    <span className={`status-badge ${getStatusClass(order.status)}`}>
                        {order.status.replace(/_/g, ' ')}
                    </span>
                </div>
            </div>

            <div className="order-details-wrapper">
                <div className="customer-info">
                    <strong>Consumer:</strong> {order.consumer_name}
                </div>

                <div className="order-items">
                    <strong>Products:</strong>
                    <ul>
                        {order.items.map((item, idx) => (
                            <li key={idx}>
                                {item.quantity}x {item.product_name} (₹{item.price} / {item.unit})
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="order-total">
                    <strong>Total Amount:</strong>
                    <span className="total-value">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
            </div>

            {nextAllowedStatuses.length > 0 && (
                <div className="order-actions">
                    <span className="action-label">Update Status:</span>
                    <div className="action-buttons">
                        {nextAllowedStatuses.map(status => (
                            <button
                                key={status}
                                className={`btn-status ${status.toLowerCase()}`}
                                onClick={() => handleStatusUpdate(status)}
                                disabled={isUpdating}
                            >
                                Mark as {status.replace(/_/g, ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderRow;
