import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import { clearCart } from './cartSlice';
import CheckoutForm from '../../../components/CheckoutForm/CheckoutForm';
import './CheckoutPage.css';

const CheckoutPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { items, subtotal } = useSelector((state) => state.cart);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!items || items.length === 0) {
            navigate('/cart');
        }
    }, [items, navigate]);

    const handleCheckoutSubmit = async (formData) => {
        setIsSubmitting(true);
        setError('');
        try {
            const response = await api.post('/cart/checkout', formData);
            if (response.status === 201) {
                // Ensure the local state clears since backend cart was deleted
                dispatch(clearCart());

                if (formData.paymentMethod === 'ONLINE' && response.data.orders?.length > 0) {
                    navigate(`/payment/${response.data.orders[0].id}`);
                } else {
                    alert('Order placed successfully!');
                    navigate('/orders');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Checkout failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const deliveryFee = subtotal > 0 ? (subtotal > 500 ? 0 : 50) : 0;
    const total = subtotal + deliveryFee;

    if (!items || items.length === 0) return null;

    return (
        <div className="checkout-page-container">
            <h1 className="checkout-page-title">Checkout</h1>

            {error && <div className="checkout-error-banner">{error}</div>}

            <div className="checkout-page-content">
                <div className="checkout-form-section">
                    <CheckoutForm onSubmit={handleCheckoutSubmit} isSubmitting={isSubmitting} />
                </div>

                <div className="checkout-summary-section">
                    <div className="order-summary-card">
                        <h2 className="summary-title">Order Details</h2>

                        <div className="order-items-list">
                            {items.map(item => (
                                <div key={item.product_id} className="summary-item">
                                    <span className="item-qty">{item.quantity}x</span>
                                    <span className="item-name">{item.name}</span>
                                    <span className="item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <hr className="summary-divider" />

                        <div className="summary-row">
                            <span className="summary-label">Items Subtotal</span>
                            <span className="summary-value">₹{subtotal.toFixed(2)}</span>
                        </div>

                        <div className="summary-row">
                            <span className="summary-label">Delivery Fee</span>
                            <span className="summary-value">{deliveryFee === 0 ? <span className="free-delivery">Free</span> : `₹${deliveryFee.toFixed(2)}`}</span>
                        </div>

                        <hr className="summary-divider" />

                        <div className="summary-row total-row">
                            <span className="summary-label">Total to Pay</span>
                            <span className="summary-value total-value">₹{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
