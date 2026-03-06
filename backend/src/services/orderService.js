import * as orderRepository from '../repositories/orderRepository.js';

export const changeOrderStatus = async (orderId, status) => {
    // Add state machine validation if needed here
    return await orderRepository.updateOrderStatus(orderId, status);
};

export const fetchConsumerOrders = async (consumerId) => {
    return await orderRepository.getConsumerOrdersList(consumerId);
};

export const fetchOrderDetails = async (consumerId, orderId) => {
    const details = await orderRepository.getOrderDetailsById(consumerId, orderId);
    if (!details) {
        throw new Error('Order not found or unauthorized');
    }
    return details;
};

export const cancelOrder = async (consumerId, orderId) => {
    const orderDetails = await orderRepository.getOrderDetailsById(consumerId, orderId);
    if (!orderDetails) {
        throw new Error('Order not found');
    }

    if (orderDetails.status !== 'PLACED' && orderDetails.status !== 'CONFIRMED') {
        throw new Error('Order cannot be cancelled at this stage. It must be in PLACED or CONFIRMED state.');
    }

    return await orderRepository.cancelConsumerOrder(consumerId, orderId);
};
