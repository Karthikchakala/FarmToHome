import React from 'react';
import QuantitySelector from '../QuantitySelector/QuantitySelector';
import './CartItem.css';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
    return (
        <div className={`cart-item ${item.isOutOfStock ? 'out-of-stock' : ''}`}>
            <div className="cart-item-image">
                <img src={item.image_url || 'https://via.placeholder.com/150'} alt={item.name} loading="lazy" />
            </div>

            <div className="cart-item-details">
                <div className="cart-item-header">
                    <h3 className="cart-item-title">{item.name}</h3>
                    <p className="cart-item-price">₹{parseFloat(item.price).toFixed(2)} / {item.unit}</p>
                </div>

                {item.isOutOfStock && (
                    <p className="stock-warning">Out of stock. Please reduce quantity or remove.</p>
                )}

                <div className="cart-item-actions">
                    <QuantitySelector
                        quantity={item.quantity}
                        onIncrease={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                        onDecrease={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                        onUpdateData={!item.isOutOfStock || item.quantity > item.stock_quantity}
                    />

                    <div className="cart-item-end">
                        <span className="cart-item-subtotal">₹{parseFloat(item.itemTotal).toFixed(2)}</span>
                        <button className="btn-remove" onClick={() => onRemove(item.product_id)}>Remove</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartItem;
