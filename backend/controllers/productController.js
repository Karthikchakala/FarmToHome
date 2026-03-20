const { query } = require('../db');
const logger = require('../config/logger');
const responseHelper = require('../utils/responseHelper');
const { asyncHandler, NotFoundError, ValidationError } = require('../middlewares/enhancedErrorHandler');
const { 
  calculateDistance, 
  isWithinRadius, 
  parseLocation, 
  getBoundingBox,
  validateCoordinates 
} = require('../utils/locationUtils');

// Get all products with optional filtering and location-based filtering
const getProducts = asyncHandler(async (req, res) => {
  const { 
    category, 
    minPrice, 
    maxPrice, 
    search, 
    sortBy = 'createdat', 
    sortOrder = 'desc',
    page = 1,
    limit = 10,
    inStock,
    lat,
    lng,
    radius = 8
  } = req.query;

  // Validate and parse pagination
  const pageNum = Math.max(parseInt(page) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
  const offset = (pageNum - 1) * limitNum;

  // Validate location parameters
  let customerLocation = null;
  let locationFiltering = false;
  
  if (lat && lng) {
    if (!validateCoordinates(lat, lng)) {
      throw new ValidationError('Invalid coordinates provided');
    }
    customerLocation = {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng)
    };
    locationFiltering = true;
  }

  // Build WHERE conditions
  const conditions = ['p.isavailable = true'];
  const params = [];
  let paramIndex = 1;

  if (category) {
    conditions.push(`p.category = $${paramIndex++}`);
    params.push(category);
  }

  if (minPrice) {
    conditions.push(`p.priceperunit >= $${paramIndex++}`);
    params.push(parseFloat(minPrice));
  }

  if (maxPrice) {
    conditions.push(`p.priceperunit <= $${paramIndex++}`);
    params.push(parseFloat(maxPrice));
  }

  if (search) {
    conditions.push(`(p.name ILIKE $${paramIndex++} OR p.description ILIKE $${paramIndex++})`);
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  if (inStock === 'true') {
    conditions.push(`p.stockquantity > 0`);
  }

  // Location-based filtering
  let locationJoin = '';
  let locationWhere = '';
  if (locationFiltering) {
    const boundingBox = getBoundingBox(customerLocation.latitude, customerLocation.longitude, parseFloat(radius) || 8);
    
    locationJoin = `
      LEFT JOIN farmers f ON p.farmerid = f._id
      LEFT JOIN users u ON f.userid = u._id
    `;
    
    locationWhere = `
      AND f.isapproved = true 
      AND f.location IS NOT NULL
      AND CAST(f.location->>'latitude' AS NUMERIC) BETWEEN ${boundingBox.minLat} AND ${boundingBox.maxLat}
      AND CAST(f.location->>'longitude' AS NUMERIC) BETWEEN ${boundingBox.minLng} AND ${boundingBox.maxLng}
    `;
  }

  // Validate sort fields
  const validSortFields = ['name', 'priceperunit', 'createdat', 'stockquantity'];
  const validSortOrders = ['asc', 'desc'];
  
  const sortField = validSortFields.includes(sortBy.toLowerCase()) ? sortBy.toLowerCase() : 'createdat';
  const sortDirection = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

  // Build the main query
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  let sql;
  if (locationFiltering) {
    sql = `
      SELECT 
        p._id,
        p.name,
        p.description,
        p.priceperunit,
        p.stockquantity,
        p.unit,
        p.category,
        p.isavailable,
        p.createdat,
        p.updatedat,
        p.images,
        f.farmname,
        f.location as farmer_location,
        f.deliveryradius,
        u.name as farmer_name,
        u.email as farmer_email,
        -- Calculate distance
        CASE 
          WHEN f.location IS NOT NULL THEN
            6371 * acos(
              cos(radians(${customerLocation.latitude})) * 
              cos(radians(CAST(f.location->>'latitude' AS NUMERIC))) * 
              cos(radians(CAST(f.location->>'longitude' AS NUMERIC) - radians(${customerLocation.longitude}))) + 
              sin(radians(${customerLocation.latitude})) * 
              sin(radians(CAST(f.location->>'latitude' AS NUMERIC)))
            )
          ELSE NULL
        END as distance
      FROM products p
      ${locationJoin}
      ${whereClause} ${locationWhere}
      ORDER BY p.${sortField} ${sortDirection}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
  } else {
    sql = `
      SELECT 
        p._id,
        p.name,
        p.description,
        p.priceperunit,
        p.stockquantity,
        p.unit,
        p.category,
        p.isavailable,
        p.createdat,
        p.updatedat,
        p.images,
        f.farmname,
        u.name as farmer_name,
        u.email as farmer_email,
        NULL as distance
      FROM products p
      LEFT JOIN farmers f ON p.farmerid = f._id
      LEFT JOIN users u ON f.userid = u._id
      ${whereClause}
      ORDER BY p.${sortField} ${sortDirection}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
  }

  // Count query for pagination
  let countSql;
  if (locationFiltering) {
    countSql = `
      SELECT COUNT(*) as total
      FROM products p
      ${locationJoin}
      ${whereClause} ${locationWhere}
    `;
  } else {
    countSql = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN farmers f ON p.farmerid = f._id
      LEFT JOIN users u ON f.userid = u._id
      ${whereClause}
    `;
  }

  // Execute queries in parallel
  const [productsResult, countResult] = await Promise.all([
    query(sql, params),
    query(countSql, params.slice(0, -2))
  ]);

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limitNum);

  // Format products and filter by exact distance
  let products = productsResult.rows.map(product => ({
    ...product,
    images: product.images ? JSON.parse(product.images) : [],
    farmer_location: product.farmer_location ? parseLocation(product.farmer_location) : null
  }));

  // If location filtering is enabled, filter by exact distance and delivery radius
  if (locationFiltering) {
    products = products
      .filter(product => {
        if (!product.farmer_location) return false;
        
        const distance = product.distance || calculateDistance(
          customerLocation.latitude,
          customerLocation.longitude,
          product.farmer_location.latitude,
          product.farmer_location.longitude
        );
        
        const deliveryRadius = product.deliveryradius || 8;
        return isWithinRadius(
          customerLocation.latitude,
          customerLocation.longitude,
          product.farmer_location.latitude,
          product.farmer_location.longitude,
          deliveryRadius
        );
      })
      .map(product => ({
        ...product,
        distance: Math.round(product.distance * 100) / 100 // Round to 2 decimal places
      }))
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  return responseHelper.paginated(res, products, {
    page: pageNum,
    limit: limitNum,
    total: locationFiltering ? products.length : total,
    pages: locationFiltering ? Math.ceil(products.length / limitNum) : totalPages,
    hasNext: pageNum < (locationFiltering ? Math.ceil(products.length / limitNum) : totalPages),
    hasPrev: pageNum > 1
  });
});

// Get featured products
const getFeaturedProducts = async (req, res, next) => {
  try {
    const { limit = 8 } = req.query;

    const sql = `
      SELECT 
        p._id,
        p.name,
        p.description,
        p.category,
        p.unit,
        p.priceperunit,
        p.stockquantity,
        p.minorderquantity,
        p.images,
        p.isavailable,
        p.harvestdate,
        p.expirydate,
        p.createdat,
        f._id as farmer_id,
        f.farmname,
        f.verificationstatus,
        f.ratingaverage,
        u.name as farmer_name
      FROM products p
      LEFT JOIN farmers f ON p.farmerid = f._id
      LEFT JOIN users u ON f.userid = u._id
      WHERE p.isavailable = true 
        AND f.verificationstatus = 'approved'
        AND p.stockquantity > 0
      ORDER BY p.createdat DESC, f.ratingaverage DESC
      LIMIT $1
    `;

    const result = await query(sql, [parseInt(limit)]);

    res.status(200).json({
      success: true,
      data: {
        products: result.rows
      }
    });

  } catch (error) {
    logger.error('Get featured products error:', error);
    next(error);
  }
};

// Get product by ID
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        p._id,
        p.name,
        p.description,
        p.category,
        p.unit,
        p.priceperunit,
        p.stockquantity,
        p.minorderquantity,
        p.images,
        p.isavailable,
        p.harvestdate,
        p.expirydate,
        p.createdat,
        p.updatedat,
        f._id as farmer_id,
        f.farmname,
        f.description as farmer_description,
        f.farmingtype,
        f.verificationstatus,
        f.ratingaverage,
        f.totalreviews,
        f.deliveryradius,
        u.name as farmer_name,
        u.email as farmer_email
      FROM products p
      LEFT JOIN farmers f ON p.farmerid = f._id
      LEFT JOIN users u ON f.userid = u._id
      WHERE p._id = $1 AND p.isavailable = true
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        product: result.rows[0]
      }
    });

  } catch (error) {
    logger.error('Get product by ID error:', error);
    next(error);
  }
};

// Get products by farmer
const getProductsByFarmer = async (req, res, next) => {
  try {
    const { farmerId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const sql = `
      SELECT 
        p._id,
        p.name,
        p.description,
        p.category,
        p.unit,
        p.priceperunit,
        p.stockquantity,
        p.minorderquantity,
        p.images,
        p.isavailable,
        p.harvestdate,
        p.expirydate,
        p.createdat,
        p.updatedat,
        f._id as farmer_id,
        f.farmname,
        f.verificationstatus,
        f.ratingaverage,
        u.name as farmer_name
      FROM products p
      LEFT JOIN farmers f ON p.farmerid = f._id
      LEFT JOIN users u ON f.userid = u._id
      WHERE p.farmerid = $1 AND p.isavailable = true
      ORDER BY p.createdat DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await query(sql, [farmerId, parseInt(limit), offset]);

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM products WHERE farmerid = $1 AND isavailable = true',
      [farmerId]
    );
    const total = parseInt(countResult.rows[0].total);

    res.status(200).json({
      success: true,
      data: {
        products: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get products by farmer error:', error);
    next(error);
  }
};

// Get categories
const getCategories = async (req, res, next) => {
  try {
    const sql = `
      SELECT DISTINCT category, COUNT(*) as product_count
      FROM products 
      WHERE isavailable = true AND category IS NOT NULL
      GROUP BY category
      ORDER BY product_count DESC
    `;

    const result = await query(sql);

    res.status(200).json({
      success: true,
      data: {
        categories: result.rows
      }
    });

  } catch (error) {
    logger.error('Get categories error:', error);
    next(error);
  }
};

// Search products
const searchProducts = async (req, res, next) => {
  try {
    const { q: query, category, page = 1, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = ['p.isavailable = true', '(p.name ILIKE $1 OR p.description ILIKE $1)'];
    const params = [`%${query}%`];
    let paramCount = 2;

    if (category) {
      conditions.push(`p.category = $${paramCount++}`);
      params.push(category);
    }

    params.push(parseInt(limit), offset);

    const whereClause = conditions.join(' AND ');

    const sql = `
      SELECT 
        p._id,
        p.name,
        p.description,
        p.category,
        p.unit,
        p.priceperunit,
        p.stockquantity,
        p.minorderquantity,
        p.images,
        p.isavailable,
        p.harvestdate,
        p.expirydate,
        p.createdat,
        f._id as farmer_id,
        f.farmname,
        f.verificationstatus,
        f.ratingaverage,
        u.name as farmer_name
      FROM products p
      LEFT JOIN farmers f ON p.farmerid = f._id
      LEFT JOIN users u ON f.userid = u._id
      WHERE ${whereClause}
      ORDER BY 
        CASE WHEN p.name ILIKE $1 THEN 1 ELSE 2 END,
        p.createdat DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const result = await query(sql, params);

    // Get total count
    const countParams = params.slice(0, -2);
    const countSql = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN farmers f ON p.farmerid = f._id
      LEFT JOIN users u ON f.userid = u._id
      WHERE ${whereClause}
    `;

    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.status(200).json({
      success: true,
      data: {
        products: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        query,
        category
      }
    });

  } catch (error) {
    logger.error('Search products error:', error);
    next(error);
  }
};

module.exports = {
  getProducts,
  getFeaturedProducts,
  getProductById,
  getProductsByFarmer,
  getCategories,
  searchProducts
};
