import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyOrders } from './ordersSlice';
import OrderCard from '../../../components/orders/OrderCard/OrderCard';
import './OrdersPage.css';

const OrdersPage = () => {
    const dispatch = useDispatch();
    const { list, status, error } = useSelector((state) => state.orders);

    useEffect(() => {
        dispatch(fetchMyOrders());
    }, [dispatch]);

    if (status === 'loading') {
        return (
            <div className="orders-page-container loader-wrapper">
                <div className="spinner"></div>
                <p>Loading your orders...</p>
            </div>
        );
    }

    if (status === 'failed') {
        return (
            <div className="orders-page-container error-wrapper">
                <p className="error-text">{error}</p>
                <button onClick={() => dispatch(fetchMyOrders())} className="retry-btn">Retry</button>
            </div>
        );
    }

    return (
        <div className="orders-page-container">
            <header className="orders-header">
                <h1>My Orders</h1>
                <p>Track, manage, and review your purchases.</p>
            </header>

            {list.length === 0 ? (
                <div className="empty-orders-state">
                    <img src="/icons/empty-box.svg" alt="No orders found" className="empty-icon" />
                    <h3>No orders yet!</h3>
                    <p>Looks like you haven't bought anything from the farmers yet.</p>
                    <a href="/products" className="browse-products-btn">Start Shopping</a>
                </div>
            ) : (
                <div className="orders-grid">
                    {list.map(order => (
                        <OrderCard key={order.order_id} order={order} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrdersPage;
