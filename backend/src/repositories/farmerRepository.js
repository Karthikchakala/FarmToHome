import { query } from '../config/db.js';

export const getFarmerProfileByUserId = async (userId) => {
    const result = await query('SELECT * FROM farmers WHERE user_id = $1', [userId]);
    return result.rows[0];
};

export const updateFarmerProfile = async (farmerId, data) => {
    const { farmName, bio, address, lat, lng, deliveryRadiusKm, minimumOrderValue } = data;

    // Update location if lat and lng are provided using PostGIS ST_SetSRID and ST_MakePoint
    let locationUpdate = '';
    const params = [farmName, bio, address, deliveryRadiusKm, minimumOrderValue, farmerId];

    if (lat && lng) {
        locationUpdate = ', location = ST_SetSRID(ST_MakePoint($7, $8), 4326)';
        params.push(lng, lat); // Note: PostGIS is (lon, lat)
    }

    const sql = `
    UPDATE farmers 
    SET farm_name = $1, bio = $2, address = $3, delivery_radius_km = $4, minimum_order_value = $5, updated_at = CURRENT_TIMESTAMP ${locationUpdate}
    WHERE id = $6
    RETURNING * 
  `;

    const result = await query(sql, params);
    return result.rows[0];
};

export const createDeliveryZone = async (farmerId, zoneName, polygonWKT) => {
    // polygonWKT e.g. 'POLYGON((lon1 lat1, lon2 lat2, ..., lon1 lat1))'
    const sql = `
    INSERT INTO delivery_zones (farmer_id, zone_name, zone_polygon) 
    VALUES ($1, $2, ST_GeomFromText($3, 4326))
    RETURNING *
  `;
    const result = await query(sql, [farmerId, zoneName, polygonWKT]);
    return result.rows[0];
};

export const getDeliveryZones = async (farmerId) => {
    const result = await query('SELECT id, zone_name, ST_AsGeoJSON(zone_polygon) as polygon FROM delivery_zones WHERE farmer_id = $1', [farmerId]);
    return result.rows;
};

export const findNearbyFarmers = async (latitude, longitude, radiusKm) => {
    const sql = `
        SELECT id, user_id, farm_name, full_name, bio, address, ST_AsGeoJSON(location) as location, delivery_radius_km, minimum_order_value,
               ST_Distance(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)) / 1000 AS distance_km,
               (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE target_type = 'farmer' AND target_id = farmers.id) as rating,
               (SELECT COUNT(*) FROM reviews WHERE target_type = 'farmer' AND target_id = farmers.id) as review_count
        FROM farmers
        WHERE is_approved = true
          AND location IS NOT NULL
          AND ST_DWithin(location, ST_SetSRID(ST_MakePoint($2, $1), 4326), $3 * 1000)
          AND (ST_Distance(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)) / 1000) <= delivery_radius_km
        ORDER BY distance_km ASC
    `;
    const result = await query(sql, [latitude, longitude, radiusKm]);
    return result.rows;
};

export const getFarmerById = async (farmerId) => {
    const sql = `
        SELECT id, user_id, farm_name, full_name, bio, address, ST_AsGeoJSON(location) as location, delivery_radius_km, minimum_order_value, created_at,
               (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE target_type = 'farmer' AND target_id = farmers.id) as rating,
               (SELECT COUNT(*) FROM reviews WHERE target_type = 'farmer' AND target_id = farmers.id) as review_count
        FROM farmers
        WHERE id = $1 AND is_approved = true
    `;
    const result = await query(sql, [farmerId]);
    return result.rows[0];
};

export const getDashboardStats = async (farmerId) => {
    // We aggregate multiple queries to return dashboard metrics

    // Total Products
    const productsQuery = await query('SELECT COUNT(*) FROM products WHERE farmer_id = $1 AND is_active = true', [farmerId]);
    const totalProducts = parseInt(productsQuery.rows[0].count, 10);

    // Order Stats (Total Orders containing farmer's products)
    const ordersQuery = await query(`
        SELECT COUNT(DISTINCT o.id) as total_orders
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE p.farmer_id = $1
    `, [farmerId]);
    const totalOrders = parseInt(ordersQuery.rows[0].total_orders, 10);

    // Pending Orders (PLACED or CONFIRMED)
    const pendingOrdersQuery = await query(`
        SELECT COUNT(DISTINCT o.id) as pending_orders
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE p.farmer_id = $1 AND o.status IN ('PLACED', 'CONFIRMED')
    `, [farmerId]);
    const pendingOrders = parseInt(pendingOrdersQuery.rows[0].pending_orders, 10);

    // Total Revenue (Sum of price * quantity for delivered/completed orders)
    const revenueQuery = await query(`
        SELECT SUM(oi.price_at_time * oi.quantity) as total_revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE p.farmer_id = $1 AND o.status IN ('DELIVERED', 'COMPLETED')
    `, [farmerId]);
    const totalRevenue = parseFloat(revenueQuery.rows[0].total_revenue || 0);

    // Low Stock Alerts (Products with stock <= 5)
    const lowStockQuery = await query(`
        SELECT id, name, stock_quantity, unit 
        FROM products 
        WHERE farmer_id = $1 AND is_active = true AND stock_quantity <= 5
        ORDER BY stock_quantity ASC
    `, [farmerId]);
    const lowStockAlerts = lowStockQuery.rows;

    return {
        totalProducts,
        totalOrders,
        pendingOrders,
        totalRevenue,
        lowStockAlerts
    };
};

export const getFarmerOrders = async (farmerId) => {
    const sql = `
        SELECT o.id as order_id, o.status, o.total_amount, o.created_at,
               c.full_name as consumer_name,
               json_agg(json_build_object(
                   'product_name', p.name,
                   'quantity', oi.quantity,
                   'price', oi.price_at_time,
                   'unit', p.unit
               )) as items
        FROM orders o
        JOIN consumers c ON o.consumer_id = c.id
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE p.farmer_id = $1
        GROUP BY o.id, o.status, o.total_amount, o.created_at, c.full_name
        ORDER BY o.created_at DESC
    `;
    const result = await query(sql, [farmerId]);
    return result.rows;
};
