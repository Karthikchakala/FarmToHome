import { query } from '../config/db.js';

export const getDashboardStats = async () => {
    const usersRes = await query(`
    SELECT 
      SUM(CASE WHEN role = 'consumer' THEN 1 ELSE 0 END) as total_consumers,
      SUM(CASE WHEN role = 'farmer' THEN 1 ELSE 0 END) as total_farmers
    FROM users
  `);

    const pendingFarmersRes = await query(`
    SELECT COUNT(*) as pending_farmers
    FROM farmers
    WHERE is_approved = false
  `);

    const ordersRes = await query(`
    SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_revenue
    FROM orders
    WHERE status != 'CANCELLED' AND status != 'FAILED'
  `);

    return {
        users: usersRes.rows[0],
        pendingFarmers: pendingFarmersRes.rows[0].pending_farmers,
        orders: ordersRes.rows[0]
    };
};

export const getPendingFarmers = async () => {
    const sql = `
    SELECT f.*, u.email 
    FROM farmers f
    JOIN users u ON f.user_id = u.id
    WHERE f.is_approved = false
    ORDER BY f.created_at DESC
  `;
    const result = await query(sql);
    return result.rows;
};

export const approveFarmerProfile = async (farmerId) => {
    const sql = `
    UPDATE farmers SET is_approved = true, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 RETURNING *
  `;
    const result = await query(sql, [farmerId]);
    return result.rows[0];
};

export const createAuditLog = async (adminId, action, targetEntity, targetId, details) => {
    const sql = `
    INSERT INTO admin_audit_logs (admin_id, action, target_entity, target_id, details)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
    const result = await query(sql, [adminId, action, targetEntity, targetId, details]);
    return result.rows[0];
};

export const getAuditLogs = async (limit = 50, offset = 0) => {
    const sql = `
    SELECT l.*, u.email as admin_email 
    FROM admin_audit_logs l
    JOIN users u ON l.admin_id = u.id
    ORDER BY l.created_at DESC
    LIMIT $1 OFFSET $2
  `;
    const result = await query(sql, [limit, offset]);
    return result.rows;
};
