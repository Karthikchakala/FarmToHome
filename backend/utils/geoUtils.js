const { query } = require('../db');
const logger = require('../config/logger');

// PostGIS geo-location utilities
class GeoUtils {
  // Convert degrees to radians
  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Calculate distance between two points using Haversine formula (fallback)
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Create PostGIS point from coordinates
  static createPoint(latitude, longitude) {
    return `ST_GeomFromText('POINT(${longitude} ${latitude})', 4326)`;
  }

  // Get nearby farmers using PostGIS
  static async getNearbyFarmers(customerLat, customerLng, radiusKm = 8) {
    try {
      const nearbyFarmersQuery = `
        SELECT 
          f._id,
          f.userid,
          f.farmname,
          f.description,
          f.location,
          f.deliveryradius,
          f.ratingaverage,
          f.totalreviews,
          f.isapproved,
          f.createdat,
          u.name as farmer_name,
          u.email as farmer_email,
          u.phone as farmer_phone,
          -- Calculate distance using PostGIS
          ST_Distance(
            f.location::geography,
            ${this.createPoint(customerLat, customerLng)}::geography
          ) / 1000 as distance_km,
          -- Check if customer is within delivery radius
          ST_DWithin(
            f.location::geography,
            ${this.createPoint(customerLat, customerLng)}::geography,
            f.deliveryradius * 1000
          ) as can_deliver
        FROM farmers f
        JOIN users u ON f.userid = u._id
        WHERE f.isapproved = true
          AND f.location IS NOT NULL
          AND ST_DWithin(
            f.location::geography,
            ${this.createPoint(customerLat, customerLng)}::geography,
            ${radiusKm * 1000}
          )
        ORDER BY distance_km ASC
        LIMIT 50
      `;

      const result = await query(nearbyFarmersQuery);
      
      return {
        success: true,
        farmers: result.rows.map(farmer => ({
          ...farmer,
          distance_km: parseFloat(farmer.distance_km),
          can_deliver: farmer.can_deliver
        }))
      };

    } catch (error) {
      logger.error('Error fetching nearby farmers:', error);
      return {
        success: false,
        error: 'Failed to fetch nearby farmers',
        farmers: []
      };
    }
  }

  // Get nearby products using PostGIS
  static async getNearbyProducts(customerLat, customerLng, radiusKm = 8, options = {}) {
    try {
      const {
        category,
        minPrice,
        maxPrice,
        inStock = true,
        page = 1,
        limit = 20
      } = options;

      const offset = (page - 1) * limit;
      
      // Build WHERE conditions
      const whereConditions = [
        'p.isavailable = true',
        'f.isapproved = true',
        'f.location IS NOT NULL',
        `ST_DWithin(
          f.location::geography,
          ${this.createPoint(customerLat, customerLng)}::geography,
          ${radiusKm * 1000}
        )`
      ];

      const queryParams = [];
      let paramIndex = 1;

      // Add stock condition
      if (inStock) {
        whereConditions.push(`p.stockquantity > 0`);
      }

      // Add category filter
      if (category) {
        whereConditions.push(`p.category = $${paramIndex}`);
        queryParams.push(category);
        paramIndex++;
      }

      // Add price filters
      if (minPrice) {
        whereConditions.push(`p.priceperunit >= $${paramIndex}`);
        queryParams.push(minPrice);
        paramIndex++;
      }

      if (maxPrice) {
        whereConditions.push(`p.priceperunit <= $${paramIndex}`);
        queryParams.push(maxPrice);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      const nearbyProductsQuery = `
        SELECT 
          p._id,
          p.name,
          p.description,
          p.category,
          p.priceperunit,
          p.unit,
          p.stockquantity,
          p.isavailable,
          p.minorderquantity,
          p.images,
          p.ratingaverage,
          p.ratingcount,
          p.createdat,
          p.updatedat,
          f._id as farmerid,
          f.userid as farmer_userid,
          f.farmname,
          f.location as farmer_location,
          f.deliveryradius,
          u.name as farmer_name,
          u.email as farmer_email,
          -- Calculate distance using PostGIS
          ST_Distance(
            f.location::geography,
            ${this.createPoint(customerLat, customerLng)}::geography
          ) / 1000 as distance_km,
          -- Check if farmer can deliver to customer location
          ST_DWithin(
            f.location::geography,
            ${this.createPoint(customerLat, customerLng)}::geography,
            f.deliveryradius * 1000
          ) as can_deliver,
          -- Estimated delivery time based on distance
          CASE 
            WHEN ST_Distance(f.location::geography, ${this.createPoint(customerLat, customerLng)}::geography) / 1000 <= 3 THEN 'Same Day'
            WHEN ST_Distance(f.location::geography, ${this.createPoint(customerLat, customerLng)}::geography) / 1000 <= 7 THEN 'Next Day'
            ELSE '2-3 Days'
          END as estimated_delivery
        FROM products p
        JOIN farmers f ON p.farmerid = f._id
        JOIN users u ON f.userid = u._id
        WHERE ${whereClause}
        ORDER BY distance_km ASC, p.ratingaverage DESC, p.createdat DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM products p
        JOIN farmers f ON p.farmerid = f._id
        WHERE ${whereClause}
      `;

      const [productsResult, countResult] = await Promise.all([
        query(nearbyProductsQuery, queryParams),
        query(countQuery, queryParams.slice(0, -2)) // Exclude limit and offset
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        products: productsResult.rows.map(product => ({
          ...product,
          distance_km: parseFloat(product.distance_km),
          can_deliver: product.can_deliver,
          images: product.images ? JSON.parse(product.images) : []
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };

    } catch (error) {
      logger.error('Error fetching nearby products:', error);
      return {
        success: false,
        error: 'Failed to fetch nearby products',
        products: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    }
  }

  // Validate delivery location for a specific farmer
  static async validateDeliveryLocation(farmerId, customerLat, customerLng) {
    try {
      const validationQuery = `
        SELECT 
          f._id,
          f.farmname,
          f.deliveryradius,
          u.name as farmer_name,
          -- Calculate distance
          ST_Distance(
            f.location::geography,
            ${this.createPoint(customerLat, customerLng)}::geography
          ) / 1000 as distance_km,
          -- Check if within delivery radius
          ST_DWithin(
            f.location::geography,
            ${this.createPoint(customerLat, customerLng)}::geography,
            f.deliveryradius * 1000
          ) as can_deliver
        FROM farmers f
        JOIN users u ON f.userid = u._id
        WHERE f._id = $1
          AND f.isapproved = true
          AND f.location IS NOT NULL
      `;

      const result = await query(validationQuery, [farmerId]);

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Farmer not found or not approved',
          can_deliver: false,
          distance_km: null
        };
      }

      const validation = result.rows[0];

      return {
        success: true,
        can_deliver: validation.can_deliver,
        distance_km: parseFloat(validation.distance_km),
        farmer: {
          id: validation._id,
          name: validation.farmname,
          farmer_name: validation.farmer_name,
          delivery_radius: validation.deliveryradius
        }
      };

    } catch (error) {
      logger.error('Error validating delivery location:', error);
      return {
        success: false,
        error: 'Failed to validate delivery location',
        can_deliver: false,
        distance_km: null
      };
    }
  }

  // Get delivery zones for a farmer
  static async getFarmerDeliveryZones(farmerId) {
    try {
      const zonesQuery = `
        SELECT 
          f._id,
          f.farmname,
          f.deliveryradius,
          f.location,
          -- Create delivery zone as a circle around farmer location
          ST_Buffer(f.location::geography, f.deliveryradius * 1000) as delivery_zone,
          -- Get bounding box for the delivery zone
          ST_XMin(ST_Envelope(ST_Buffer(f.location::geography, f.deliveryradius * 1000))) as min_lng,
          ST_YMin(ST_Envelope(ST_Buffer(f.location::geography, f.deliveryradius * 1000))) as min_lat,
          ST_XMax(ST_Envelope(ST_Buffer(f.location::geography, f.deliveryradius * 1000))) as max_lng,
          ST_YMax(ST_Envelope(ST_Buffer(f.location::geography, f.deliveryradius * 1000))) as max_lat
        FROM farmers f
        WHERE f._id = $1
          AND f.isapproved = true
          AND f.location IS NOT NULL
      `;

      const result = await query(zonesQuery, [farmerId]);

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Farmer not found or not approved',
          zones: []
        };
      }

      const zone = result.rows[0];

      return {
        success: true,
        zones: [{
          farmer_id: zone._id,
          farm_name: zone.farmname,
          delivery_radius: zone.deliveryradius,
          center: {
            latitude: parseFloat(ST_Y(zone.location)),
            longitude: parseFloat(ST_X(zone.location))
          },
          bounds: {
            min_lat: parseFloat(zone.min_lat),
            min_lng: parseFloat(zone.min_lng),
            max_lat: parseFloat(zone.max_lat),
            max_lng: parseFloat(zone.max_lng)
          }
        }]
      };

    } catch (error) {
      logger.error('Error fetching farmer delivery zones:', error);
      return {
        success: false,
        error: 'Failed to fetch delivery zones',
        zones: []
      };
    }
  }

  // Update farmer location with PostGIS point
  static async updateFarmerLocation(farmerId, latitude, longitude) {
    try {
      const updateQuery = `
        UPDATE farmers 
        SET 
          location = ${this.createPoint(latitude, longitude)},
          updatedat = CURRENT_TIMESTAMP
        WHERE _id = $1
        RETURNING location, updatedat
      `;

      const result = await query(updateQuery, [farmerId]);

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Farmer not found'
        };
      }

      return {
        success: true,
        location: result.rows[0].location,
        updated_at: result.rows[0].updatedat
      };

    } catch (error) {
      logger.error('Error updating farmer location:', error);
      return {
        success: false,
        error: 'Failed to update farmer location'
      };
    }
  }

  // Search farmers by location with filters
  static async searchFarmersByLocation(customerLat, customerLng, filters = {}) {
    try {
      const {
        radiusKm = 8,
        minRating = 0,
        categories = [],
        page = 1,
        limit = 20
      } = filters;

      const offset = (page - 1) * limit;

      // Build WHERE conditions
      const whereConditions = [
        'f.isapproved = true',
        'f.location IS NOT NULL',
        `ST_DWithin(
          f.location::geography,
          ${this.createPoint(customerLat, customerLng)}::geography,
          ${radiusKm * 1000}
        )`
      ];

      const queryParams = [];
      let paramIndex = 1;

      // Add rating filter
      if (minRating > 0) {
        whereConditions.push(`f.ratingaverage >= $${paramIndex}`);
        queryParams.push(minRating);
        paramIndex++;
      }

      // Add category filter (if farmer has products in specific categories)
      if (categories.length > 0) {
        whereConditions.push(`EXISTS (
          SELECT 1 FROM products p 
          WHERE p.farmerid = f._id 
          AND p.category = ANY($${paramIndex})
          AND p.isavailable = true
        )`);
        queryParams.push(categories);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      const searchQuery = `
        SELECT 
          f._id,
          f.userid,
          f.farmname,
          f.description,
          f.location,
          f.deliveryradius,
          f.ratingaverage,
          f.totalreviews,
          f.createdat,
          u.name as farmer_name,
          u.email as farmer_email,
          u.phone as farmer_phone,
          -- Calculate distance
          ST_Distance(
            f.location::geography,
            ${this.createPoint(customerLat, customerLng)}::geography
          ) / 1000 as distance_km,
          -- Get available products count
          (SELECT COUNT(*) 
           FROM products p 
           WHERE p.farmerid = f._id 
           AND p.isavailable = true 
           AND p.stockquantity > 0
          ) as available_products_count
        FROM farmers f
        JOIN users u ON f.userid = u._id
        WHERE ${whereClause}
        ORDER BY distance_km ASC, f.ratingaverage DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM farmers f
        WHERE ${whereClause}
      `;

      const [farmersResult, countResult] = await Promise.all([
        query(searchQuery, queryParams),
        query(countQuery, queryParams.slice(0, -2))
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        farmers: farmersResult.rows.map(farmer => ({
          ...farmer,
          distance_km: parseFloat(farmer.distance_km),
          available_products_count: parseInt(farmer.available_products_count)
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };

    } catch (error) {
      logger.error('Error searching farmers by location:', error);
      return {
        success: false,
        error: 'Failed to search farmers',
        farmers: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    }
  }
}

module.exports = GeoUtils;
