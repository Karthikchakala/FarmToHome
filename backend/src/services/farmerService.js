import * as farmerRepository from '../repositories/farmerRepository.js';
import * as productRepository from '../repositories/productRepository.js';

export const getFarmerProfile = async (userId) => {
    const profile = await farmerRepository.getFarmerProfileByUserId(userId);
    if (!profile) throw new Error('Farmer profile not found');
    return profile;
};

export const updateFarmerProfile = async (userId, data) => {
    const profile = await getFarmerProfile(userId);
    return await farmerRepository.updateFarmerProfile(profile.id, data);
};

export const addDeliveryZone = async (userId, zoneName, coordinates) => {
    const profile = await getFarmerProfile(userId);

    // Convert coordinates array to WKT POLYGON
    // Expecting format: [{lat, lng}, {lat, lng}, ...]
    if (!coordinates || coordinates.length < 3) {
        throw new Error('A polygon requires at least 3 points');
    }

    // Ensure polygon is closed (first point == last point)
    const firstPt = coordinates[0];
    const lastPt = coordinates[coordinates.length - 1];
    if (firstPt.lat !== lastPt.lat || firstPt.lng !== lastPt.lng) {
        coordinates.push({ ...firstPt });
    }

    const pointStrings = coordinates.map(pt => `${pt.lng} ${pt.lat}`).join(', ');
    const polygonWKT = `POLYGON((${pointStrings}))`;

    return await farmerRepository.createDeliveryZone(profile.id, zoneName, polygonWKT);
};

export const listDeliveryZones = async (userId) => {
    const profile = await getFarmerProfile(userId);
    return await farmerRepository.getDeliveryZones(profile.id);
};

export const listNearbyFarmers = async (latitude, longitude, radius) => {
    return await farmerRepository.findNearbyFarmers(latitude, longitude, radius);
};

export const getFarmerDetails = async (farmerId) => {
    const farmer = await farmerRepository.getFarmerById(farmerId);
    if (!farmer) throw new Error('Farmer not found');

    const products = await productRepository.getFarmerProducts(farmerId);
    return { ...farmer, products };
};

export const getDashboardData = async (userId) => {
    const profile = await getFarmerProfile(userId);
    return await farmerRepository.getDashboardStats(profile.id);
};

export const getFarmerOrders = async (userId) => {
    const profile = await getFarmerProfile(userId);
    return await farmerRepository.getFarmerOrders(profile.id);
};
