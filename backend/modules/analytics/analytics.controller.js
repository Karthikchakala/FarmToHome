import * as analyticsService from './analytics.service.js';
import { dateRangeSchema } from './analytics.validation.js';

const parseQuery = (query) => {
    const parsed = dateRangeSchema.safeParse(query);
    if (!parsed.success) return {};
    return parsed.data;
};

export const getOverview = async (req, res) => {
    try {
        const data = await analyticsService.getPlatformOverview();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getOrdersAnalytics = async (req, res) => {
    try {
        const params = parseQuery(req.query);
        const data = await analyticsService.getOrdersAnalytics(params);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getRevenueAnalytics = async (req, res) => {
    try {
        const params = parseQuery(req.query);
        const data = await analyticsService.getRevenueAnalytics(params);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getTopFarmers = async (req, res) => {
    try {
        const params = parseQuery(req.query);
        const data = await analyticsService.getTopFarmers(params);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getTopProducts = async (req, res) => {
    try {
        const params = parseQuery(req.query);
        const data = await analyticsService.getTopProducts(params);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getSubscriptionAnalytics = async (req, res) => {
    try {
        const data = await analyticsService.getSubscriptionAnalytics();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
