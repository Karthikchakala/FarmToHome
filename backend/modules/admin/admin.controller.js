import * as adminService from './admin.service.js';

export const getDashboard = async (req, res) => {
    try {
        const data = await adminService.getDashboardMetrics();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getFarmers = async (req, res) => {
    try {
        const farmers = await adminService.getAllFarmers();
        res.json({ success: true, data: farmers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const approveFarmer = async (req, res) => {
    try {
        const { farmerId } = req.params;
        const adminId = req.user.id;
        const result = await adminService.approveFarmer(farmerId, adminId);
        res.json({ success: true, data: result, message: 'Farmer approval status updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const suspendFarmer = async (req, res) => {
    try {
        const { farmerId } = req.params;
        const adminId = req.user.id;
        const result = await adminService.suspendFarmer(farmerId, adminId);
        res.json({ success: true, data: result, message: 'Farmer suspended' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getConsumers = async (req, res) => {
    try {
        const consumers = await adminService.getAllConsumers();
        res.json({ success: true, data: consumers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const banConsumer = async (req, res) => {
    try {
        const { consumerId } = req.params;
        const adminId = req.user.id;
        const result = await adminService.banConsumer(consumerId, adminId);
        res.json({ success: true, data: result, message: 'Consumer banned' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getOrders = async (req, res) => {
    try {
        const { status, startDate, endDate, farmerId, consumerId } = req.query;
        const orders = await adminService.getOrders({ status, startDate, endDate, farmerId, consumerId });
        res.json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getReviews = async (req, res) => {
    try {
        const reviews = await adminService.getReviews();
        res.json({ success: true, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const setMinPrice = async (req, res) => {
    try {
        const { category, minPrice } = req.body;
        const adminId = req.user.id;
        // Assuming updating all existing items or storing this rule somewhere. 
        // The spec said: "Admin sets a minimum price for categories to prevent unfair pricing."
        const result = await adminService.setMinPriceForCategory(category, minPrice, adminId);
        res.json({ success: true, data: result, message: 'Minimum price updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
