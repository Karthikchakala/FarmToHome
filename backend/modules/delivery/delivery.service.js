import { query } from '../../src/config/db.js';
import { makePoint, makePolygon } from './geo.service.js';

// ─── Farmers ─────────────────────────────────────────────────────────────────

export const updateFarmerLocation = async (farmerId, { latitude, longitude, deliveryRadius }) => {
  const point = makePoint(longitude, latitude);
  // Optional deliveryRadius update if provided
  const radiusUpdate = deliveryRadius !== undefined ? `, delivery_radius_km = $2` : '';
  const args = deliveryRadius !== undefined ? [point, deliveryRadius, farmerId] : [point, farmerId];

  const result = await query(
    `UPDATE farmers SET location = ST_GeomFromEWKT($1)${radiusUpdate}, updated_at = NOW() WHERE id = $${args.length} RETURNING id, delivery_radius_km`,
    args
  );
  if (!result.rows.length) throw new Error('Farmer not found');
  return result.rows[0];
};

export const updateFarmerSlots = async (farmerId, slots) => {
  const result = await query(
    `UPDATE farmers SET delivery_slots = $1, updated_at = NOW() WHERE id = $2 RETURNING id, delivery_slots`,
    [JSON.stringify(slots), farmerId]
  );
  if (!result.rows.length) throw new Error('Farmer not found');
  return result.rows[0];
};

/**
 * Get farmers near a specific location using PostGIS ST_DWithin.
 * radius is the bounding box to search, but we also filter by the farmer's own delivery_radius_km.
 */
export const getNearbyFarmers = async (latitude, longitude, maxSearchRadiusKm = 20) => {
  const point = makePoint(longitude, latitude);
  // PostGIS ST_DWithin on GEOGRAPHY uses meters
  const result = await query(`
    SELECT
      f.id, f.farm_name, f.full_name, f.bio, f.is_approved, f.delivery_radius_km, f.delivery_slots,
      ST_Distance(f.location, ST_GeomFromEWKT($1)) / 1000 AS distance_km
    FROM farmers f
    WHERE f.is_approved = true
      AND f.location IS NOT NULL
      -- Filter within the consumer's max search radius (e.g. show within 20km)
      AND ST_DWithin(f.location, ST_GeomFromEWKT($1), $2 * 1000)
      -- AND crucially, make sure the distance is within the FARMER'S configured delivery radius
      AND ST_Distance(f.location, ST_GeomFromEWKT($1)) <= (f.delivery_radius_km * 1000)
    ORDER BY distance_km ASC
  `, [point, maxSearchRadiusKm]);

  return result.rows.map(r => ({
    ...r,
    distance_km: parseFloat(r.distance_km).toFixed(2)
  }));
};

// ─── Consumers ───────────────────────────────────────────────────────────────

export const saveConsumerAddress = async (consumerId, { street, city, state, postalCode, latitude, longitude }) => {
  const point = makePoint(longitude, latitude);
  const fullAddress = `${street}, ${city}, ${state} ${postalCode}`;

  const result = await query(
    `UPDATE consumers 
     SET default_address = $1, location = ST_GeomFromEWKT($2), updated_at = NOW() 
     WHERE id = $3 RETURNING id, default_address`,
    [fullAddress, point, consumerId]
  );
  if (!result.rows.length) throw new Error('Consumer not found');
  return result.rows[0];
};

// ─── Admin: Delivery Zones ────────────────────────────────────────────────────

export const getDeliveryZones = async () => {
  const result = await query(`
    SELECT dz.id, dz.zone_name, dz.is_active, dz.created_at,
        f.farm_name, f.id as farmer_id,
        ST_AsGeoJSON(dz.zone_polygon) as polygon_json
    FROM delivery_zones dz
    JOIN farmers f ON f.id = dz.farmer_id
    ORDER BY dz.created_at DESC
  `);
  return result.rows.map(r => ({
    ...r,
    polygon: r.polygon_json ? JSON.parse(r.polygon_json).coordinates[0].map(p => ({ longitude: p[0], latitude: p[1] })) : null
  }));
};

export const createDeliveryZone = async ({ farmerId, zoneName, zonePolygon, isActive }) => {
  const polyStr = makePolygon(zonePolygon);
  const result = await query(
    `INSERT INTO delivery_zones(farmer_id, zone_name, zone_polygon, is_active)
    VALUES($1, $2, ST_GeomFromEWKT($3), $4) RETURNING id`,
    [farmerId, zoneName, polyStr, isActive]
  );
  return result.rows[0];
};

export const updateDeliveryZone = async (zoneId, { zoneName, zonePolygon, isActive }) => {
  const updates = [];
  const args = [];
  let idx = 1;

  if (zoneName !== undefined) { updates.push(`zone_name = $${idx++}`); args.push(zoneName); }
  if (isActive !== undefined) { updates.push(`is_active = $${idx++}`); args.push(isActive); }
  if (zonePolygon !== undefined) {
    updates.push(`zone_polygon = ST_GeomFromEWKT($${idx++})`);
    args.push(makePolygon(zonePolygon));
  }

  if (updates.length === 0) return { id: zoneId };
  args.push(zoneId);

  const result = await query(
    `UPDATE delivery_zones SET \${ updates.join(', ') } WHERE id = $\${ idx } RETURNING id`,
    args
  );
  if (!result.rows.length) throw new Error('Zone not found');
  return result.rows[0];
};

export const deleteDeliveryZone = async (zoneId) => {
  const result = await query(`DELETE FROM delivery_zones WHERE id = $1 RETURNING id`, [zoneId]);
  if (!result.rows.length) throw new Error('Zone not found');
  return true;
};
