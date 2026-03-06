import * as supportService from '../services/supportService.js';

export const createSubscription = async (req, res, next) => {
    try {
        const { farmerId, productId, frequency, quantity } = req.body;
        const sub = await supportService.subscribeToProduct(req.user.id, farmerId, productId, frequency, quantity);
        res.status(201).json({ message: 'Subscription created', subscription: sub });
    } catch (error) {
        next(error);
    }
};

export const getSubscriptions = async (req, res, next) => {
    try {
        const subs = await supportService.getConsumerSubscriptions(req.user.id);
        res.json(subs);
    } catch (error) {
        next(error);
    }
};

export const getWallet = async (req, res, next) => {
    try {
        const balance = await supportService.checkWallet(req.user.id);
        res.json({ balance });
    } catch (error) {
        next(error);
    }
};

export const topUp = async (req, res, next) => {
    try {
        const { amount } = req.body;
        const result = await supportService.topUpWallet(req.user.id, amount);
        res.json({ message: 'Wallet topped up', ...result });
    } catch (error) {
        next(error);
    }
};

export const postReview = async (req, res, next) => {
    try {
        const { farmerId, rating, comment } = req.body;
        const review = await supportService.writeReview(req.user.id, farmerId, rating, comment);
        res.status(201).json({ message: 'Review submitted', review });
    } catch (error) {
        next(error);
    }
};
