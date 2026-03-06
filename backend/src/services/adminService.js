import * as adminRepository from '../repositories/adminRepository.js';

export const getDashboardStats = async () => {
    return await adminRepository.getDashboardStats();
};

export const getPendingFarmers = async () => {
    return await adminRepository.getPendingFarmers();
};

export const approveFarmer = async (adminUserId, farmerId) => {

    // Verify farmer exists
    const { getClient } = await import('../config/db.js');
    const client = await getClient();
    const farmerRes = await client.query('SELECT * FROM farmers WHERE id = $1', [farmerId]);
    client.release();

    if (farmerRes.rows.length === 0) {
        throw new Error('Farmer not found');
    }

    const farmer = farmerRes.rows[0];
    if (farmer.is_approved) {
        throw new Error('Farmer is already approved');
    }

    const approvedFarmer = await adminRepository.approveFarmerProfile(farmerId);

    // Log the action
    await adminRepository.createAuditLog(
        adminUserId,
        'APPROVE_FARMER',
        'FARMER',
        farmerId,
        `Approved farmer profile for ${farmer.farm_name || 'Unknown Farm'}`
    );

    return approvedFarmer;
};

export const getAuditLogs = async (limit, offset) => {
    return await adminRepository.getAuditLogs(limit, offset);
};
