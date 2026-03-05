import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCart, updateCartItem, removeCartItem, clearCart } from './cartSlice';
import CartItem from '../../../components/CartItem/CartItem';
import CartSummary from '../../../components/CartSummary/CartSummary';
import './CartPage.css';

const CartPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { items, subtotal, status, error } = useSelector((state) => state.cart);

    useEffect(() => {
        dispatch(fetchCart());
    }, [dispatch]);

    const handleUpdateQuantity = (productId, quantity) => {
        dispatch(updateCartItem({ productId, quantity }));
    };

    const handleRemoveItem = (productId) => {
        dispatch(removeCartItem(productId));
    };

    const handleClearCart = () => {
        if (window.confirm("Are you sure you want to completely clear your cart?")) {
            dispatch(clearCart());
        }
    };

    const handleCheckout = () => {
        navigate('/checkout');
    };

    if (status === 'loading' && items.length === 0) {
        return <div className="cart-page-loading">Loading your cart...</div>;
    }

    if (status === 'failed') {
        return <div className="cart-page-error">Error: {error}</div>;
    }

    const hasItems = items && items.length > 0;
    const hasOutOfStockItems = items.some(item => item.isOutOfStock);

    return (
        <div className="cart-page-container">
            <div className="cart-page-header">
                <h1 className="cart-page-title">Your Cart</h1>
                {hasItems && (
                    <button className="btn-clear-cart" onClick={handleClearCart}>
                        Clear Cart
                    </button>
                )}
            </div>

            {hasItems ? (
                <div className="cart-page-content">
                    <div className="cart-items-section">
                        {items.map(item => (
                            <CartItem
                                key={item.product_id}
                                item={item}
                                onUpdateQuantity={handleUpdateQuantity}
                                onRemove={handleRemoveItem}
                            />
                        ))}
                    </div>

                    <div className="cart-summary-section">
                        <CartSummary
                            subtotal={subtotal}
                            onCheckout={handleCheckout}
                            disabled={hasOutOfStockItems}
                        />
                    </div>
                </div>
            ) : (
                <div className="cart-empty-state">
                    <div className="empty-icon">🛒</div>
                    <h2>Your cart is currently empty</h2>
                    <p>Looks like you haven't added anything to your cart yet.</p>
                    <button className="btn-continue-shopping" onClick={() => navigate('/products')}>
                        Continue Shopping
                    </button>
                </div>
            )}
        </div>
    );
};

export default CartPage;
