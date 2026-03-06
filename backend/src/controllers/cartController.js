import * as cartService from '../services/cartService.js';
import * as userRepository from '../repositories/userRepository.js';
import { getClient } from '../config/db.js';

// Helper to get consumer profile ID from authenticated user ID
const getConsumerId = async (userId) => {
    const client = await getClient();
    try {
        const consumerProf = await client.query('SELECT id FROM consumers WHERE user_id = $1', [userId]);
        if (consumerProf.rows.length === 0) {
            throw new Error('Consumer profile required');
        }
        return consumerProf.rows[0].id;
    } finally {
        client.release();
    }
};

export const addToCart = async (req, res, next) => {
    try {
        const { productId, quantity } = req.body;
        const consumerId = await getConsumerId(req.user.id);
        const cartItem = await cartService.addProductToCart(consumerId, productId, quantity);
        res.status(201).json({ message: 'Added to cart', cartItem });
    } catch (error) {
        if (error.message.includes('Insufficient stock')) res.status(400);
        next(error);
    }
};

export const getCart = async (req, res, next) => {
    try {
        const consumerId = await getConsumerId(req.user.id);
        const cart = await cartService.viewCart(consumerId);
        res.json(cart);
    } catch (error) {
        if (error.message === 'Consumer profile required') {
            return res.json({ items: [], quantity: 0, subtotal: 0, totalPrice: 0 });
        }
        next(error);
    }
};

export const updateCartItem = async (req, res, next) => {
    try {
        const { productId, quantity } = req.body;
        const consumerId = await getConsumerId(req.user.id);
        const updatedItem = await cartService.updateProductQuantity(consumerId, productId, quantity);
        res.json({ message: 'Cart updated', updatedItem });
    } catch (error) {
        if (error.message.includes('Insufficient stock')) res.status(400);
        next(error);
    }
};

export const removeCartItem = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const consumerId = await getConsumerId(req.user.id);
        await cartService.removeItemFromCart(consumerId, productId);
        res.json({ message: 'Item removed from cart' });
    } catch (error) {
        next(error);
    }
};

export const clearCart = async (req, res, next) => {
    try {
        const consumerId = await getConsumerId(req.user.id);
        await cartService.clearUserCart(consumerId);
        res.json({ message: 'Cart cleared' });
    } catch (error) {
        next(error);
    }
};

export const checkout = async (req, res, next) => {
    try {
        const { deliveryAddress, deliverySlot, paymentMethod } = req.body;
        const consumerId = await getConsumerId(req.user.id);
        const orders = await cartService.checkout(consumerId, deliveryAddress, deliverySlot, paymentMethod);
        res.status(201).json({ message: 'Order placed successfully', orders });
    } catch (error) {
        if (error.message.includes('empty') || error.message.includes('out of stock')) {
            res.status(400);
        }
        next(error);
    }
};
