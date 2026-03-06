import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderById, cancelMyOrder, clearCurrentOrder } from './ordersSlice';
import OrderTimeline from '../../../components/orders/OrderTimeline/OrderTimeline';
import OrderItem from '../../../components/orders/OrderItem/OrderItem';
import OrderStatusBadge from '../../../components/orders/OrderStatusBadge/OrderStatusBadge';
import './OrderDetailsPage.css';

const OrderDetailsPage = () => {
    const { orderId } = useParams();
    const dispatch = useDispatch();
    const { currentOrder, detailsStatus, cancelStatus, error } = useSelector((state) => state.orders);

    useEffect(() => {
        dispatch(fetchOrderById(orderId));
        return () => {
            dispatch(clearCurrentOrder());
        };
    }, [dispatch, orderId]);

    const handleCancel = () => {
        if (window.confirm("Are you sure you want to cancel this order?")) {
            dispatch(cancelMyOrder(orderId));
        }
    };

    if (detailsStatus === 'loading') {
        return (
            <div className="order-details-wrapper loader-wrapper">
                <div className="spinner"></div>
                <h2>Loading order specifics...</h2>
            </div>
        );
    }

    if (detailsStatus === 'failed' || !currentOrder) {
        return (
            <div className="order-details-wrapper error-wrapper">
                <p className="error-text">{error || "Could not find this order."}</p>
                <Link to="/orders" className="back-link">← Back to Orders</Link>
            </div>
        );
    }

    const {
        order_number, created_at, status, total_amount,
        farm_name, farmer_phone, delivery_address, delivery_slot,
        payment_method, items
    } = currentOrder;

    const canCancel = (status === 'PLACED' || status === 'CONFIRMED');

    return (
        <div className="order-details-wrapper">
            <div className="details-header-nav">
                <Link to="/orders" className="back-link">← Back to all orders</Link>
                {canCancel && (
                    <button
                        className="cancel-order-btn"
                        onClick={handleCancel}
                        disabled={cancelStatus === 'loading'}
                    >
                        {cancelStatus === 'loading' ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                )}
            </div>

            {cancelStatus === 'failed' && <div className="cancel-error">{error}</div>}

            <div className="receipt-container">
                <header className="receipt-header">
                    <div>
                        <h1>Order #{order_number || orderId.substring(0, 8)}</h1>
                        <p className="receipt-date">{new Date(created_at).toLocaleString()}</p>
                    </div>
                    <div className="receipt-status">
                        <OrderStatusBadge status={status} />
                    </div>
                </header>

                <div className="timeline-section">
                    <OrderTimeline currentStatus={status} />
                </div>

                <div className="receipt-body">
                    <section className="items-section">
                        <h3>Items Ordered</h3>
                        <div className="items-list">
                            {items && items.map((item) => (
                                <OrderItem key={item.order_item_id} item={item} />
                            ))}
                        </div>
                    </section>

                    <aside className="summary-section">
                        <div className="summary-card">
                            <h3>Delivery Details</h3>
                            <p><strong>From:</strong> {farm_name}</p>
                            {farmer_phone && <p><strong>Farm Contact:</strong> {farmer_phone}</p>}
                            <div className="divider"></div>
                            <p><strong>To:</strong><br />{delivery_address}</p>
                            {delivery_slot && <p><strong>Slot:</strong> {delivery_slot}</p>}
                        </div>

                        <div className="summary-card">
                            <h3>Payment Summary</h3>
                            <div className="payment-row">
                                <span>Method</span>
                                <span>{payment_method}</span>
                            </div>
                            <div className="payment-row total-row">
                                <span>Total Amount</span>
                                <span>₹{parseFloat(total_amount).toFixed(2)}</span>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsPage;
