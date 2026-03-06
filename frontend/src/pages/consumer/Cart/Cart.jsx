import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/axiosConfig.js';
import Button from '../../../components/Button/Button.jsx';
import Loader from '../../../components/Loader/Loader.jsx';
import Input from '../../../components/Input/Input.jsx';
import './Cart.css';

const Cart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [address, setAddress] = useState('');
    const [checkingOut, setCheckingOut] = useState(false);
    const navigate = useNavigate();

    const fetchCart = async () => {
        try {
            setLoading(true);
            const res = await api.get('/orders/cart');
            setCartItems(res.data);
        } catch (err) {
            console.error(err);
            alert('Failed to load cart');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    const handleCheckout = async () => {
        if (!address) {
            alert('Please provide a delivery address');
            return;
        }

        if (cartItems.length === 0) return;

        // For V1 MVP: We checkout by picking the farmer of the first item
        // In a fully robust implementation, we'd split orders per farmer
        const farmerId = cartItems[0].farmer_id;

        try {
            setCheckingOut(true);
            await api.post('/orders/checkout', {
                farmerId,
                deliveryAddress: address
            });
            alert('Order placed successfully!');
            navigate('/consumer/orders'); // Navigate to history immediately
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error pushing checkout transaction');
        } finally {
            setCheckingOut(false);
        }
    };

    if (loading) return <Loader />;

    const totalAmount = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

    return (
        <div className="cart-container page-wrapper">
            <h1 className="cart-header">Your Shopping Cart</h1>

            {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '8px' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-light)' }}>Your cart is empty</h3>
                    <Button variant="primary" onClick={() => navigate('/products')}>Browse Fresh Produce</Button>
                </div>
            ) : (
                <div className="cart-content">
                    <div className="cart-items-list">
                        {cartItems.map((item) => (
                            <div key={item.id} className="cart-item">
                                <div className="item-info">
                                    <h3>{item.name}</h3>
                                    <div className="item-farmer">From Farmer ID: {item.farmer_id}</div>
                                </div>
                                <div className="item-controls">
                                    <span>Qty: <strong>{item.quantity}</strong></span>
                                    <span className="item-price">₹{parseFloat(item.price) * item.quantity}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="cart-summary">
                        <h3 className="summary-title">Order Summary</h3>
                        <div className="summary-row">
                            <span>Items Total</span>
                            <span>₹{totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Delivery Fee</span>
                            <span>₹0.00 (Hyperlocal)</span>
                        </div>
                        <div className="summary-row total">
                            <span>Grand Total</span>
                            <span>₹{totalAmount.toFixed(2)}</span>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <Input
                                label="Delivery Address"
                                placeholder="Enter exact delivery location"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </div>

                        <Button
                            variant="primary"
                            className="checkout-btn"
                            onClick={handleCheckout}
                            disabled={checkingOut}
                        >
                            {checkingOut ? 'Processing...' : 'Place Cash on Delivery Order'}
                        </Button>
                        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem', textAlign: 'center' }}>
                            Payments are currently Cash on Delivery only.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
