import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFarmerOrders, updateFarmerOrderStatus } from './farmerOrdersSlice';
import OrderRow from '../../../components/farmer/OrderRow/OrderRow';
import './FarmerOrdersPage.css';

const FarmerOrdersPage = () => {
    const dispatch = useDispatch();
    const { orders, status, error } = useSelector((state) => state.farmerOrders);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchFarmerOrders());
        }
    }, [dispatch, status]);

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await dispatch(updateFarmerOrderStatus({ orderId, status: newStatus })).unwrap();
        } catch (err) {
            console.error('Failed to update order status:', err);
            alert('Failed to update order status');
        }
    };

    if (status === 'loading') return <div className="page-loading">Loading your orders...</div>;
    if (status === 'failed') return <div className="page-error">Error: {error}</div>;

    const filteredOrders = filter === 'ALL'
        ? orders
        : orders.filter(o => o.status === filter);

    return (
        <div className="farmer-orders-page">
            <header className="page-header">
                <div className="header-info">
                    <h1>Order Management</h1>
                    <p>Track statuses and fulfill incoming customer orders.</p>
                </div>

                <div className="order-filters">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="ALL">All Orders</option>
                        <option value="PLACED">Placed</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="PACKED">Packed</option>
                        <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                        <option value="DELIVERED">Delivered</option>
                    </select>
                </div>
            </header>

            <div className="orders-list">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map(order => (
                        <OrderRow
                            key={order.order_id}
                            order={order}
                            onUpdateStatus={handleUpdateStatus}
                        />
                    ))
                ) : (
                    <div className="empty-catalog-state">
                        <span className="empty-icon">📂</span>
                        <h2>No orders found</h2>
                        <p>You don't have any orders matching the current filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FarmerOrdersPage;
