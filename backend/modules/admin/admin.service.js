import { query, getClient } from '../../src/config/db.js';

export const getDashboardMetrics = async () => {
  // Parallelize these independent queries
  const [
    usersRes, farmersRes, consumersRes, ordersRes,
    revenueRes, newUsersRes, ordersPerDayRes
  ] = await Promise.all([
    query('SELECT COUNT(*) FROM users;'),
    query('SELECT COUNT(*) FROM farmers;'),
    query('SELECT COUNT(*) FROM consumers;'),
    query('SELECT COUNT(*) FROM orders;'),
    query("SELECT SUM(total_amount) as total FROM orders WHERE status = 'COMPLETED';"),
    query("SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days';"),
    // A query for daily orders limit 7 days for a chart
    query(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM orders 
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at) 
      ORDER BY DATE(created_at)
    `)
  ]);

  return {
    totalUsers: parseInt(usersRes.rows[0].count, 10),
    totalFarmers: parseInt(farmersRes.rows[0].count, 10),
    totalConsumers: parseInt(consumersRes.rows[0].count, 10),
    totalOrders: parseInt(ordersRes.rows[0].count, 10),
    totalRevenue: parseFloat(revenueRes.rows[0].total || 0),
    newUsersThisWeek: parseInt(newUsersRes.rows[0].count, 10),
    ordersPerDay: ordersPerDayRes.rows
  };
};

export const getAllFarmers = async () => {
  const result = await query(`
    SELECT f.id as farmer_id, f.farm_name, f.full_name as farmer_name, 
           f.is_approved as verification_status,
           (SELECT COALESCE(AVG(rating), 0) FROM reviews r WHERE r.target_id = f.id AND r.target_type = 'farmer') as rating,
           (SELECT COUNT(*) FROM products p WHERE p.farmer_id = f.id) as total_products,
           u.is_active
    FROM farmers f
    JOIN users u ON f.user_id = u.id
    ORDER BY f.created_at DESC
  `);
  return result.rows;
};

export const approveFarmer = async (farmerId, adminId) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const updateRes = await client.query(
      'UPDATE farmers SET is_approved = true WHERE id = $1 RETURNING *',
      [farmerId]
    );

    // Log action
    await client.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, new_state) 
       VALUES ($1, 'approve_farmer', 'farmers', $2, $3)`,
      [adminId, farmerId, JSON.stringify(updateRes.rows[0])]
    );

    await client.query('COMMIT');
    return updateRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const suspendFarmer = async (farmerId, adminId) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // The spec says "Prevents farmer from selling products". So we mark their user as inactive or set is_approved = false.
    // Setting their related user account to inactive is best.
    const getUserIdRes = await client.query('SELECT user_id FROM farmers WHERE id = $1', [farmerId]);
    if (getUserIdRes.rows.length === 0) throw new Error('Farmer not found');
    const userId = getUserIdRes.rows[0].user_id;

    const updateRes = await client.query(
      'UPDATE users SET is_active = false WHERE id = $1 RETURNING *',
      [userId]
    );

    await client.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, new_state) 
       VALUES ($1, 'suspend_farmer', 'farmers', $2, '{"is_active": false}')`,
      [adminId, farmerId]
    );

    await client.query('COMMIT');
    return { suspended: true, farmerId };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const getAllConsumers = async () => {
  const result = await query(`
    SELECT c.id as consumer_id, c.full_name as name, u.email, c.phone,
    (SELECT COUNT(*) FROM orders o WHERE o.consumer_id = c.id) as total_orders,
        u.is_active as account_status
    FROM consumers c
    JOIN users u ON c.user_id = u.id
    ORDER BY c.created_at DESC
    `);
  return result.rows;
};

export const banConsumer = async (consumerId, adminId) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const getUserIdRes = await client.query('SELECT user_id FROM consumers WHERE id = $1', [consumerId]);
    if (getUserIdRes.rows.length === 0) throw new Error('Consumer not found');
    const userId = getUserIdRes.rows[0].user_id;

    await client.query(
      'UPDATE users SET is_active = false WHERE id = $1 RETURNING *',
      [userId]
    );

    await client.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, new_state) 
       VALUES ($1, 'ban_consumer', 'consumers', $2, '{"is_active": false}')`,
      [adminId, consumerId]
    );

    await client.query('COMMIT');
    return { banned: true, consumerId };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const getOrders = async ({ status, startDate, endDate, farmerId, consumerId }) => {
  let queryString = `
    SELECT o.id as order_id, o.order_number, o.total_amount, o.status, o.created_at,
           c.full_name as consumer_name, f.farm_name as farmer_name
    FROM orders o
    JOIN consumers c ON o.consumer_id = c.id
    JOIN farmers f ON o.farmer_id = f.id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (status) {
    queryString += ` AND o.status = $${paramIndex++}`;
    params.push(status);
  }
  if (startDate) {
    queryString += ` AND o.created_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  if (endDate) {
    queryString += ` AND o.created_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  if (farmerId) {
    queryString += ` AND o.farmer_id = $${paramIndex++}`;
    params.push(farmerId);
  }
  if (consumerId) {
    queryString += ` AND o.consumer_id = $${paramIndex++}`;
    params.push(consumerId);
  }

  queryString += ' ORDER BY o.created_at DESC LIMIT 100'; // Simple pagination/limit

  const result = await query(queryString, params);
  return result.rows;
};

export const getReviews = async () => {
  const result = await query(`
    SELECT r.id, r.rating, r.comment, r.created_at, r.target_type, r.target_id,
    c.full_name as reviewer_name
    FROM reviews r
    JOIN consumers c ON r.consumer_id = c.id
    ORDER BY r.created_at DESC
    LIMIT 50
    `);
  return result.rows;
};

export const setMinPriceForCategory = async (category, minPrice, adminId) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Update existing products violating the new rule
    const updateRes = await client.query(
      'UPDATE products SET price = $1 WHERE category = $2 AND price < $1 RETURNING id',
      [minPrice, category]
    );

    // Note: There is no global table for min price rules. 
    // In a real system we'd create a \`category_rules\` table, but the spec says "Do NOT create new tables" and "Use existing tables".
    // Therefore we just enforce it by updating existing offending products, and log the action.

    await client.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, new_state) 
       VALUES ($1, 'set_min_price', 'category_products', $2)`,
      [adminId, JSON.stringify({ category, minPrice, affectedProducts: updateRes.rowCount })]
    );

    await client.query('COMMIT');
    return { affectedProducts: updateRes.rowCount, category, enforcedMinPrice: minPrice };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
