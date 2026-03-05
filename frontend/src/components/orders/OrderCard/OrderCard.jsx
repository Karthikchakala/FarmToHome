import React from 'react';
import OrderStatusBadge from '../OrderStatusBadge/OrderStatusBadge';
import { Link } from 'react-router-dom';
import './OrderCard.css';

const OrderCard = ({ order }) => {
    return (
        <div className="consumer-order-card">
            <div className="order-card-header">
                <div className="order-main-info">
                    <span className="order-number">Order #{order.order_number || order.order_id.substring(0, 8)}</span>
                    <span className="order-date">Placed on {new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className="order-amount">
                    ₹{parseFloat(order.total_amount).toFixed(2)}
                </div>
            </div>

            <div className="order-card-body">
                <div className="order-farm-status">
                    <div className="farm-name">From <strong>{order.farm_name}</strong></div>
                    <OrderStatusBadge status={order.status} />
                </div>
                <div className="product-count-summary">
                    Includes {order.product_count} product{order.product_count !== '1' ? 's' : ''}
                </div>
            </div>

            <div className="order-card-footer">
                <Link to={`/orders/${order.order_id}`} className="view-details-btn">
                    View Details
                </Link>
            </div>
        </div>
    );
};

export default OrderCard;
