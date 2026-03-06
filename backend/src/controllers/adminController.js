import * as adminService from '../services/adminService.js';

export const getDashboardMetrics = async (req, res, next) => {
    try {
        const stats = await adminService.getDashboardStats();
        res.json(stats);
    } catch (error) {
        next(error);
    }
};

export const getPendingFarmers = async (req, res, next) => {
    try {
        const farmers = await adminService.getPendingFarmers();
        res.json(farmers);
    } catch (error) {
        next(error);
    }
};

export const approveFarmer = async (req, res, next) => {
    try {
        const { farmerId } = req.params;
        const adminUserId = req.user.id; // from protect middleware

        const approved = await adminService.approveFarmer(adminUserId, farmerId);
        res.json({ message: 'Farmer approved successfully', farmer: approved });
    } catch (error) {
        next(error);
    }
};

export const getLogs = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const logs = await adminService.getAuditLogs(limit, offset);
        res.json(logs);
    } catch (error) {
        next(error);
    }
};
