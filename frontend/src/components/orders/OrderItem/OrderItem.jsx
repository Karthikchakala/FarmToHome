import React from 'react';
import './OrderItem.css';

const OrderItem = ({ item }) => {
    return (
        <div className="order-item-row">
            <div className="order-item-image">
                <img
                    src={item.image_url || 'https://via.placeholder.com/80?text=Food'}
                    alt={item.name}
                    loading="lazy"
                />
            </div>
            <div className="order-item-details">
                <h4 className="item-name">{item.name}</h4>
                <p className="item-meta">
                    Unit: {item.unit} | Price at time: ₹{parseFloat(item.price_at_time).toFixed(2)}
                </p>
            </div>
            <div className="order-item-quantity">
                Qty: {item.quantity}
            </div>
            <div className="order-item-subtotal">
                ₹{(parseFloat(item.price_at_time) * item.quantity).toFixed(2)}
            </div>
        </div>
    );
};

export default OrderItem;
