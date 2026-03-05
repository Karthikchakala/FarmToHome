import * as orderService from '../services/orderService.js';
import * as userRepository from '../repositories/userRepository.js';

export const updateStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const { orderId } = req.params;

        const updatedOrder = await orderService.changeOrderStatus(orderId, status);
        res.json({ message: 'Order status updated', order: updatedOrder });
    } catch (error) {
        next(error);
    }
};

export const getConsumerOrders = async (req, res, next) => {
    try {
        const consumer = await userRepository.getConsumerProfileByUserId(req.user.id);
        if (!consumer) {
            return res.status(404).json({ message: 'Consumer profile not found' });
        }

        const orders = await orderService.fetchConsumerOrders(consumer.id);
        res.json(orders);
    } catch (error) {
        next(error);
    }
};

export const getOrderDetails = async (req, res, next) => {
    try {
        const consumer = await userRepository.getConsumerProfileByUserId(req.user.id);
        if (!consumer) return res.status(404).json({ message: 'Consumer profile not found' });

        const order = await orderService.fetchOrderDetails(consumer.id, req.params.orderId);
        res.json(order);
    } catch (error) {
        if (error.message.includes('not found')) res.status(404);
        next(error);
    }
};

export const cancelOrder = async (req, res, next) => {
    try {
        const consumer = await userRepository.getConsumerProfileByUserId(req.user.id);
        if (!consumer) return res.status(404).json({ message: 'Consumer profile not found' });

        const cancelledOrder = await orderService.cancelOrder(consumer.id, req.params.orderId);
        res.json({ message: 'Order cancelled successfully', order: cancelledOrder });
    } catch (error) {
        if (error.message.includes('cannot be cancelled')) res.status(400);
        else if (error.message.includes('not found')) res.status(404);
        next(error);
    }
};
