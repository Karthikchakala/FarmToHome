import React from 'react';
import './QuantitySelector.css';

const QuantitySelector = ({ quantity, onIncrease, onDecrease, onUpdateData }) => {
    return (
        <div className="quantity-selector">
            <button
                className="qty-btn"
                onClick={onDecrease}
                disabled={quantity <= 1 || !onUpdateData}>
                -
            </button>
            <span className="qty-value">{quantity}</span>
            <button
                className="qty-btn"
                onClick={onIncrease}
                disabled={!onUpdateData}>
                +
            </button>
        </div>
    );
};

export default QuantitySelector;
