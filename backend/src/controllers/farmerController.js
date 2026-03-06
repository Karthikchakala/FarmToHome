import * as farmerService from '../services/farmerService.js';
import logger from '../config/logger.js';

export const getProfile = async (req, res, next) => {
    try {
        const profile = await farmerService.getFarmerProfile(req.user.id);
        res.json(profile);
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const updatedProfile = await farmerService.updateFarmerProfile(req.user.id, req.body);
        res.json(updatedProfile);
    } catch (error) {
        next(error);
    }
};

export const addDeliveryZone = async (req, res, next) => {
    try {
        const { zoneName, coordinates } = req.body;
        const zone = await farmerService.addDeliveryZone(req.user.id, zoneName, coordinates);
        res.status(201).json(zone);
    } catch (error) {
        next(error);
    }
};

export const getDeliveryZones = async (req, res, next) => {
    try {
        const zones = await farmerService.listDeliveryZones(req.user.id);
        res.json(zones);
    } catch (error) {
        next(error);
    }
};

export const getNearbyFarmers = async (req, res, next) => {
    try {
        const { latitude, longitude, radius = 7 } = req.query;
        if (!latitude || !longitude) {
            res.status(400);
            throw new Error('Please provide latitude and longitude query parameters');
        }

        const farmers = await farmerService.listNearbyFarmers(parseFloat(latitude), parseFloat(longitude), parseFloat(radius));
        res.json(farmers);
    } catch (error) {
        next(error);
    }
};

export const getFarmerDetails = async (req, res, next) => {
    try {
        const farmer = await farmerService.getFarmerDetails(req.params.farmerId);
        res.json(farmer);
    } catch (error) {
        if (error.message === 'Farmer not found') res.status(404);
        next(error);
    }
};

export const getDashboard = async (req, res, next) => {
    try {
        const stats = await farmerService.getDashboardData(req.user.id);
        res.json(stats);
    } catch (error) {
        next(error);
    }
};

export const getOrders = async (req, res, next) => {
    try {
        const orders = await farmerService.getFarmerOrders(req.user.id);
        res.json(orders);
    } catch (error) {
        next(error);
    }
};
