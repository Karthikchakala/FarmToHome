import { query } from '../../src/config/db.js';

// Helper: resolve period into a days integer
const periodDays = (period = '30d') => {
    const map = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    return map[period] || 30;
};

// ─── Overview ─────────────────────────────────────────────────────────────────

export const getPlatformOverview = async () => {
    const result = await query(`
    SELECT
      (SELECT COUNT(*) FROM users)       AS total_users,
      (SELECT COUNT(*) FROM farmers)     AS total_farmers,
      (SELECT COUNT(*) FROM consumers)   AS total_consumers,
      (SELECT COUNT(*) FROM products WHERE is_active = true) AS total_products,
      (SELECT COUNT(*) FROM orders)      AS total_orders,
      (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status != 'CANCELLED') AS total_revenue,
      (SELECT COUNT(*) FROM subscriptions WHERE status = 'active')  AS active_subscriptions,
      (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days') AS new_users_7d,
      (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '7 days') AS new_orders_7d
  `);
    return result.rows[0];
};

// ─── Orders Analytics ────────────────────────────────────────────────────────

export const getOrdersAnalytics = async ({ period }) => {
    const days = periodDays(period);

    const [byDay, byCancellation, byStatus] = await Promise.all([
        // Orders per day
        query(`
      SELECT DATE(created_at) AS date, COUNT(*) AS count
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `),
        // Cancellation rate
        query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'CANCELLED') AS cancelled,
        COUNT(*) AS total
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '${days} days'
    `),
        // Status breakdown
        query(`
      SELECT status, COUNT(*) AS count
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY status
      ORDER BY count DESC
    `),
    ]);

    const { cancelled, total } = byCancellation.rows[0];
    const cancellationRate = total > 0 ? ((cancelled / total) * 100).toFixed(1) : '0.0';

    return {
        ordersPerDay: byDay.rows,
        cancellationRate: parseFloat(cancellationRate),
        statusBreakdown: byStatus.rows,
        totalInPeriod: parseInt(total),
    };
};

// ─── Revenue Analytics ───────────────────────────────────────────────────────

export const getRevenueAnalytics = async ({ period }) => {
    const days = periodDays(period);

    const [byDay, byMonth, byFarmer] = await Promise.all([
        query(`
      SELECT DATE(created_at) AS date,
             COALESCE(SUM(total_amount), 0) AS revenue
      FROM orders
      WHERE status != 'CANCELLED'
        AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `),
        query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS month,
             COALESCE(SUM(total_amount), 0) AS revenue
      FROM orders
      WHERE status != 'CANCELLED'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `),
        query(`
      SELECT f.id AS farmer_id, f.farm_name, f.full_name AS farmer_name,
             COALESCE(SUM(o.total_amount), 0) AS total_revenue,
             COUNT(o.id) AS total_orders
      FROM farmers f
      LEFT JOIN orders o ON o.farmer_id = f.id AND o.status != 'CANCELLED'
      GROUP BY f.id, f.farm_name, f.full_name
      ORDER BY total_revenue DESC
      LIMIT 10
    `),
    ]);

    return {
        revenuePerDay: byDay.rows.map(r => ({ ...r, revenue: parseFloat(r.revenue) })),
        revenuePerMonth: byMonth.rows.map(r => ({ ...r, revenue: parseFloat(r.revenue) })),
        revenueByFarmer: byFarmer.rows.map(r => ({ ...r, total_revenue: parseFloat(r.total_revenue) })),
    };
};

// ─── Top Farmers ─────────────────────────────────────────────────────────────

export const getTopFarmers = async ({ limit = 10 }) => {
    const result = await query(`
    SELECT
      f.id,
      f.farm_name,
      f.full_name AS farmer_name,
      COALESCE(AVG(r.rating), 0)          AS avg_rating,
      COUNT(DISTINCT o.id)                 AS total_orders,
      COALESCE(SUM(o.total_amount), 0)     AS total_revenue,
      COUNT(DISTINCT p.id)                 AS total_products
    FROM farmers f
    LEFT JOIN orders  o ON o.farmer_id = f.id AND o.status != 'CANCELLED'
    LEFT JOIN reviews r ON r.target_id = f.id AND r.target_type = 'farmer'
    LEFT JOIN products p ON p.farmer_id = f.id AND p.is_active = true
    GROUP BY f.id, f.farm_name, f.full_name
    ORDER BY total_revenue DESC
    LIMIT $1
  `, [limit]);

    return result.rows.map(r => ({
        ...r,
        avg_rating: parseFloat(r.avg_rating).toFixed(1),
        total_revenue: parseFloat(r.total_revenue),
    }));
};

// ─── Top Products ─────────────────────────────────────────────────────────────

export const getTopProducts = async ({ limit = 10 }) => {
    const result = await query(`
    SELECT
      p.id,
      p.name AS product_name,
      p.category,
      p.unit,
      p.price,
      COALESCE(SUM(oi.quantity), 0)              AS units_sold,
      COALESCE(SUM(oi.quantity * oi.price_at_time), 0) AS total_revenue,
      f.farm_name
    FROM products p
    JOIN order_items oi ON oi.product_id = p.id
    JOIN orders     o  ON o.id = oi.order_id AND o.status != 'CANCELLED'
    JOIN farmers    f  ON f.id = p.farmer_id
    GROUP BY p.id, p.name, p.category, p.unit, p.price, f.farm_name
    ORDER BY total_revenue DESC
    LIMIT $1
  `, [limit]);

    return result.rows.map(r => ({
        ...r,
        units_sold: parseInt(r.units_sold),
        total_revenue: parseFloat(r.total_revenue),
    }));
};

// ─── Subscription Analytics ──────────────────────────────────────────────────

export const getSubscriptionAnalytics = async () => {
    const [totals, popular, growth] = await Promise.all([
        query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'active')    AS active,
        COUNT(*) FILTER (WHERE status = 'paused')    AS paused,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled
      FROM subscriptions
    `),
        query(`
      SELECT p.name AS product_name, p.unit, f.farm_name,
             COUNT(s.id) AS subscriber_count
      FROM subscriptions s
      JOIN products p ON p.id = s.product_id
      JOIN farmers f  ON f.id = s.farmer_id
      WHERE s.status IN ('active', 'paused')
      GROUP BY p.name, p.unit, f.farm_name
      ORDER BY subscriber_count DESC
      LIMIT 10
    `),
        query(`
      SELECT DATE_TRUNC('month', created_at) AS month,
             COUNT(*) AS new_subscriptions
      FROM subscriptions
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
      LIMIT 12
    `),
    ]);

    return {
        totals: totals.rows[0],
        popular: popular.rows,
        growth: growth.rows,
    };
};
