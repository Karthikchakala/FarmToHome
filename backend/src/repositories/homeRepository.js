import { query } from '../config/db.js';

// Fetch featured products — top rated, most recent active products
export const getFeaturedProducts = async (limit = 8) => {
    const sql = `
    SELECT p.id, p.name, p.description, p.category, p.price, p.unit, p.image_url, p.stock_quantity,
           f.farm_name, f.full_name AS farmer_name, f.address AS farmer_location,
           COALESCE(AVG(r.rating), 0) AS avg_rating,
           COUNT(DISTINCT r.id) AS review_count
    FROM products p
    JOIN farmers f ON p.farmer_id = f.id
    LEFT JOIN reviews r ON p.id = r.product_id
    WHERE p.is_active = true AND f.is_approved = true
    GROUP BY p.id, f.farm_name, f.full_name, f.address
    ORDER BY avg_rating DESC, p.created_at DESC
    LIMIT $1
  `;
    try {
        const result = await query(sql, [limit]);
        return result.rows;
    } catch {
        // reviews table may not exist yet
        const fallback = `
      SELECT p.id, p.name, p.description, p.category, p.price, p.unit, p.image_url, p.stock_quantity,
             f.farm_name, f.full_name AS farmer_name, f.address AS farmer_location,
             0 AS avg_rating, 0 AS review_count
      FROM products p
      JOIN farmers f ON p.farmer_id = f.id
      WHERE p.is_active = true AND f.is_approved = true
      ORDER BY p.created_at DESC
      LIMIT $1
    `;
        const result = await query(fallback, [limit]);
        return result.rows;
    }
};

// Fetch featured / verified farmers with product count
export const getFeaturedFarmers = async (limit = 6) => {
    const sql = `
    SELECT f.id, f.farm_name, f.full_name, f.bio, f.address, f.farming_method,
           f.image_url, f.average_rating,
           COUNT(p.id) AS product_count
    FROM farmers f
    LEFT JOIN products p ON p.farmer_id = f.id AND p.is_active = true
    WHERE f.is_approved = true
    GROUP BY f.id
    ORDER BY f.average_rating DESC NULLS LAST, f.created_at DESC
    LIMIT $1
  `;
    try {
        const result = await query(sql, [limit]);
        return result.rows;
    } catch {
        const fallback = `
      SELECT f.id, f.farm_name, f.full_name, f.bio, f.address,
             f.image_url,
             0 AS product_count, 0 AS average_rating
      FROM farmers f
      WHERE f.is_approved = true
      ORDER BY f.created_at DESC
      LIMIT $1
    `;
        const result = await query(fallback, [limit]);
        return result.rows;
    }
};

// Fetch latest reviews
export const getReviews = async (limit = 6) => {
    const sql = `
    SELECT r.id, r.rating, r.comment, r.created_at,
           u.name AS user_name,
           p.name AS product_name
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    JOIN products p ON r.product_id = p.id
    ORDER BY r.created_at DESC
    LIMIT $1
  `;
    try {
        const result = await query(sql, [limit]);
        return result.rows;
    } catch {
        return [];
    }
};
