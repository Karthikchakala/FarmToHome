import { query } from '../config/db.js';

export const createProduct = async (farmerId, productData) => {
  const { name, description, category, price, stockQuantity, unit, imageUrl } = productData;
  const sql = `
    INSERT INTO products (farmer_id, name, description, category, price, stock_quantity, unit, image_url)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING * 
  `;
  const result = await query(sql, [farmerId, name, description, category, price, stockQuantity, unit, imageUrl]);
  return result.rows[0];
};

export const updateProduct = async (farmerId, productId, updateData) => {
  const { name, description, category, price, stockQuantity, unit, imageUrl, isActive } = updateData;
  const sql = `
    UPDATE products 
    SET name=$1, description=$2, category=$3, price=$4, stock_quantity=$5, unit=$6, image_url=$7, is_active=$8, updated_at=CURRENT_TIMESTAMP
    WHERE id=$9 AND farmer_id=$10
    RETURNING *
  `;
  const result = await query(sql, [name, description, category, price, stockQuantity, unit, imageUrl, isActive, productId, farmerId]);
  return result.rows[0];
};

// PostGIS Geospatial Query to find active products matching the consumer's search within 7KM
export const findNearbyProducts = async (lat, lng, radiusKm = 7, filters = {}) => {
  const { search, category, minPrice, maxPrice, limit = 20, offset = 0 } = filters;

  let sql = `
    SELECT p.*, 
           f.farm_name, f.full_name as farmer_name, f.delivery_radius_km,
           ST_Distance(f.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)) / 1000 AS distance_km
    FROM products p
    JOIN farmers f ON p.farmer_id = f.id
    WHERE p.is_active = true 
      AND f.is_approved = true
      AND f.location IS NOT NULL
      AND ST_DWithin(
        f.location, 
        ST_SetSRID(ST_MakePoint($2, $1), 4326), 
        $3 * 1000 -- ST_DWithin uses meters for GEOGRAPHY types
      )
      AND (ST_Distance(f.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)) / 1000) <= f.delivery_radius_km
  `;

  const params = [lat, lng, radiusKm];
  let paramIdx = 4;

  if (search) {
    sql += ` AND p.name ILIKE $${paramIdx}`;
    params.push(`%${search}%`);
    paramIdx++;
  }
  if (category) {
    sql += ` AND p.category = $${paramIdx}`;
    params.push(category);
    paramIdx++;
  }
  if (minPrice !== undefined) {
    sql += ` AND p.price >= $${paramIdx}`;
    params.push(minPrice);
    paramIdx++;
  }
  if (maxPrice !== undefined) {
    sql += ` AND p.price <= $${paramIdx}`;
    params.push(maxPrice);
    paramIdx++;
  }

  sql += ` ORDER BY distance_km ASC LIMIT $${paramIdx} OFFSET $${paramIdx + 1};`;
  params.push(limit, offset);

  const result = await query(sql, params);

  // Get total count for pagination
  let countSql = `
    SELECT COUNT(*) 
    FROM products p
    JOIN farmers f ON p.farmer_id = f.id
    WHERE p.is_active = true 
      AND f.is_approved = true
      AND f.location IS NOT NULL
      AND ST_DWithin(f.location, ST_SetSRID(ST_MakePoint($2, $1), 4326), $3 * 1000)
      AND (ST_Distance(f.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)) / 1000) <= f.delivery_radius_km
  `;
  const countParams = [lat, lng, radiusKm];
  let countParamIdx = 4;

  if (search) { countSql += ` AND p.name ILIKE $${countParamIdx}`; countParams.push(`%${search}%`); countParamIdx++; }
  if (category) { countSql += ` AND p.category = $${countParamIdx}`; countParams.push(category); countParamIdx++; }
  if (minPrice !== undefined) { countSql += ` AND p.price >= $${countParamIdx}`; countParams.push(minPrice); countParamIdx++; }
  if (maxPrice !== undefined) { countSql += ` AND p.price <= $${countParamIdx}`; countParams.push(maxPrice); countParamIdx++; }

  const countResult = await query(countSql, countParams);
  const totalCount = parseInt(countResult.rows[0].count, 10);

  return { products: result.rows, totalCount };
};

export const getProductById = async (productId) => {
  const sql = `
    SELECT p.*, f.farm_name, f.full_name as farmer_name, ST_AsGeoJSON(f.location) as location
    FROM products p
    JOIN farmers f ON p.farmer_id = f.id
    WHERE p.id = $1 AND p.is_active = true
  `;
  const result = await query(sql, [productId]);
  return result.rows[0];
};

export const getProductReviews = async (productId) => {
  const sql = `
    SELECT r.*, c.full_name as reviewer_name
    FROM reviews r
    JOIN consumers c ON r.consumer_id = c.id
    WHERE r.target_type = 'product' AND r.target_id = $1
    ORDER BY r.created_at DESC
  `;
  const result = await query(sql, [productId]);
  return result.rows;
};

export const getFarmerProducts = async (farmerId) => {
  const sql = 'SELECT * FROM products WHERE farmer_id = $1 ORDER BY created_at DESC';
  const result = await query(sql, [farmerId]);
  return result.rows;
};
