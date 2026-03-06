import React from 'react';
import './CartSummary.css';

const CartSummary = ({ subtotal, onCheckout, isLoading, disabled }) => {
    // Assuming delivery calculation is fixed for now, or free.
    const deliveryFee = subtotal > 0 ? 50 : 0;
    const isFreeDelivery = subtotal > 500;
    const finalDelivery = isFreeDelivery ? 0 : deliveryFee;
    const total = subtotal + finalDelivery;

    return (
        <div className="cart-summary-card">
            <h2 className="summary-title">Order Summary</h2>

            <div className="summary-row">
                <span className="summary-label">Items Subtotal</span>
                <span className="summary-value">₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="summary-row">
                <span className="summary-label">Delivery Fee</span>
                {isFreeDelivery ? (
                    <span className="summary-value free-delivery">Free</span>
                ) : (
                    <span className="summary-value">₹{finalDelivery.toFixed(2)}</span>
                )}
            </div>

            {subtotal > 0 && !isFreeDelivery && (
                <div className="summary-note">
                    Add ₹{(500 - subtotal).toFixed(2)} more for free delivery!
                </div>
            )}

            <hr className="summary-divider" />

            <div className="summary-row total-row">
                <span className="summary-label">Total to Pay</span>
                <span className="summary-value total-value">₹{total.toFixed(2)}</span>
            </div>

            <button
                className={`btn-checkout ${disabled ? 'disabled' : ''}`}
                onClick={onCheckout}
                disabled={disabled || isLoading}
            >
                {isLoading ? 'Processing...' : 'Proceed to Checkout'}
            </button>
        </div>
    );
};

export default CartSummary;
