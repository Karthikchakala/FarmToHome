import * as subService from './subscriptions.service.js';
import { createSubscriptionSchema } from './subscriptions.validation.js';

export const createSubscription = async (req, res) => {
    try {
        const parsed = createSubscriptionSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, errors: parsed.error.flatten() });
        }

        // Get consumerId from authenticated user
        const consumerRes = await import('../../src/config/db.js').then(m =>
            m.query('SELECT id FROM consumers WHERE user_id = $1', [req.user.id])
        );
        if (!consumerRes.rows.length) return res.status(404).json({ success: false, message: 'Consumer profile not found' });
        const consumerId = consumerRes.rows[0].id;

        const subscriptions = await subService.createSubscription(consumerId, parsed.data);
        res.status(201).json({ success: true, data: subscriptions, message: 'Subscription created successfully' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const getMySubscriptions = async (req, res) => {
    try {
        const consumerRes = await import('../../src/config/db.js').then(m =>
            m.query('SELECT id FROM consumers WHERE user_id = $1', [req.user.id])
        );
        if (!consumerRes.rows.length) return res.status(404).json({ success: false, message: 'Consumer profile not found' });
        const consumerId = consumerRes.rows[0].id;

        const subs = await subService.getConsumerSubscriptions(consumerId);
        res.json({ success: true, data: subs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getSubscriptionDetails = async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const consumerRes = await import('../../src/config/db.js').then(m =>
            m.query('SELECT id FROM consumers WHERE user_id = $1', [req.user.id])
        );
        if (!consumerRes.rows.length) return res.status(404).json({ success: false, message: 'Consumer profile not found' });
        const consumerId = consumerRes.rows[0].id;

        const sub = await subService.getSubscriptionById(subscriptionId, consumerId);
        res.json({ success: true, data: sub });
    } catch (err) {
        res.status(404).json({ success: false, message: err.message });
    }
};

const resolveConsumerId = async (userId) => {
    const { query } = await import('../../src/config/db.js');
    const res = await query('SELECT id FROM consumers WHERE user_id = $1', [userId]);
    if (!res.rows.length) throw new Error('Consumer profile not found');
    return res.rows[0].id;
};

export const pauseSubscription = async (req, res) => {
    try {
        const consumerId = await resolveConsumerId(req.user.id);
        const result = await subService.pauseSubscription(req.params.subscriptionId, consumerId);
        res.json({ success: true, data: result, message: 'Subscription paused' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const resumeSubscription = async (req, res) => {
    try {
        const consumerId = await resolveConsumerId(req.user.id);
        const result = await subService.resumeSubscription(req.params.subscriptionId, consumerId);
        res.json({ success: true, data: result, message: 'Subscription resumed' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const cancelSubscription = async (req, res) => {
    try {
        const consumerId = await resolveConsumerId(req.user.id);
        const result = await subService.cancelSubscription(req.params.subscriptionId, consumerId);
        res.json({ success: true, data: result, message: 'Subscription cancelled' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
