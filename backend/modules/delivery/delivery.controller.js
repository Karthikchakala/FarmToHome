import * as deliveryService from './delivery.service.js';
import * as validation from './delivery.validation.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getConsumerId = async (req) => {
    const result = await import('../../src/config/db.js').then(m => m.query('SELECT id FROM consumers WHERE user_id = $1', [req.user.id]));
    if (!result.rows.length) throw new Error('Consumer profile not found');
    return result.rows[0].id;
};

const getFarmerId = async (req) => {
    const result = await import('../../src/config/db.js').then(m => m.query('SELECT id FROM farmers WHERE user_id = $1', [req.user.id]));
    if (!result.rows.length) throw new Error('Farmer profile not found');
    return result.rows[0].id;
};

// ─── Farmers ─────────────────────────────────────────────────────────────────

export const updateFarmerLocation = async (req, res) => {
    try {
        const parsed = validation.updateFarmerLocationSchema.parse(req.body);
        const farmerId = await getFarmerId(req);
        const updated = await deliveryService.updateFarmerLocation(farmerId, parsed);
        res.json({ success: true, data: updated, message: 'Location updated successfully' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const updateDeliverySlots = async (req, res) => {
    try {
        const parsed = validation.updateDeliverySlotsSchema.parse(req.body);
        const farmerId = await getFarmerId(req);
        const updated = await deliveryService.updateFarmerSlots(farmerId, parsed.deliverySlots);
        res.json({ success: true, data: updated, message: 'Delivery slots updated successfully' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const getNearFarmers = async (req, res) => {
    try {
        const { latitude, longitude, radius } = req.query;
        if (!latitude || !longitude) return res.status(400).json({ success: false, message: 'latitude and longitude required' });

        // Default search radius is 20km (though results are also filtered by farmer's deliveryRadius)
        const maxSearchRadius = parseFloat(radius) || 20;
        const farmers = await deliveryService.getNearbyFarmers(parseFloat(latitude), parseFloat(longitude), maxSearchRadius);

        res.json({ success: true, count: farmers.length, data: farmers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Consumers ───────────────────────────────────────────────────────────────

export const saveConsumerAddress = async (req, res) => {
    try {
        const parsed = validation.saveConsumerAddressSchema.parse(req.body);
        const consumerId = await getConsumerId(req);
        const updated = await deliveryService.saveConsumerAddress(consumerId, parsed);
        res.json({ success: true, data: updated, message: 'Address saved successfully' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ─── Admin Delivery Zones ────────────────────────────────────────────────────

export const getDeliveryZones = async (req, res) => {
    try {
        const zones = await deliveryService.getDeliveryZones();
        res.json({ success: true, data: zones });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const createDeliveryZone = async (req, res) => {
    try {
        const parsed = validation.createDeliveryZoneSchema.parse(req.body);
        const newZone = await deliveryService.createDeliveryZone(parsed);
        res.status(201).json({ success: true, data: newZone, message: 'Delivery zone created' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const updateDeliveryZone = async (req, res) => {
    try {
        const parsed = validation.updateDeliveryZoneSchema.parse(req.body);
        const updated = await deliveryService.updateDeliveryZone(req.params.zoneId, parsed);
        res.json({ success: true, data: updated, message: 'Delivery zone updated' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

export const deleteDeliveryZone = async (req, res) => {
    try {
        await deliveryService.deleteDeliveryZone(req.params.zoneId);
        res.json({ success: true, message: 'Delivery zone deleted' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
