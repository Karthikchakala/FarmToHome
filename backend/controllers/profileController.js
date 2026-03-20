const { query } = require('../db');
const logger = require('../config/logger');
const responseHelper = require('../utils/responseHelper');
const { asyncHandler, NotFoundError, ValidationError } = require('../middlewares/enhancedErrorHandler');
const { 
  validateCoordinates, 
  validateAddress, 
  formatAddress, 
  createLocationObject,
  parseLocation,
  calculateDistance,
  isWithinRadius
} = require('../utils/locationUtils');

// Get user profile
const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;

  let profileQuery, profileData;

  if (userRole === 'consumer') {
    profileQuery = `
      SELECT 
        u._id,
        u.name,
        u.email,
        u.phone,
        u.role,
        c._id as consumer_id,
        c.defaultaddress,
        c.preferences,
        c.createdat as consumer_created_at
      FROM users u
      LEFT JOIN consumers c ON u._id = c.userid
      WHERE u._id = $1
    `;
  } else if (userRole === 'farmer') {
    profileQuery = `
      SELECT 
        u._id,
        u.name,
        u.email,
        u.phone,
        u.role,
        f._id as farmer_id,
        f.farmname,
        f.description,
        f.farmingtype,
        f.location,
        f.latitude,
        f.longitude,
        f.deliveryradius,
        f.isapproved,
        f.verificationstatus,
        f.ratingaverage,
        f.createdat as farmer_created_at
      FROM users u
      LEFT JOIN farmers f ON u._id = f.userid
      WHERE u._id = $1
    `;
  } else {
    // Admin profile
    profileQuery = `
      SELECT 
        _id,
        name,
        email,
        phone,
        role,
        createdat
      FROM users
      WHERE _id = $1
    `;
  }

  const result = await query(profileQuery, [userId]);

  if (result.rows.length === 0) {
    throw new NotFoundError('User profile not found');
  }

  profileData = result.rows[0];

  // Parse location if exists
  if (profileData.location) {
    profileData.location = parseLocation(profileData.location);
  }

  // Parse default address if exists
  if (profileData.defaultaddress) {
    try {
      profileData.defaultaddress = JSON.parse(profileData.defaultaddress);
    } catch (error) {
      profileData.defaultaddress = null;
    }
  }

  // Parse preferences if exists
  if (profileData.preferences) {
    try {
      profileData.preferences = JSON.parse(profileData.preferences);
    } catch (error) {
      profileData.preferences = null;
    }
  }

  return responseHelper.success(res, profileData, 'Profile retrieved successfully');
});

// Update customer profile
const updateCustomerProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { name, phone } = req.body;

  // Update user basic info
  const userUpdateQuery = `
    UPDATE users 
    SET name = COALESCE($1, name), 
        phone = COALESCE($2, phone),
        updatedat = CURRENT_TIMESTAMP
    WHERE _id = $3
    RETURNING *
  `;

  await query(userUpdateQuery, [name, phone, userId]);

  return responseHelper.success(res, { message: 'Profile updated successfully' });
});

// Update customer location
const updateCustomerLocation = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { latitude, longitude, address } = req.body;

  // Validate coordinates
  if (!validateCoordinates(latitude, longitude)) {
    throw new ValidationError('Invalid coordinates provided');
  }

  // Validate address
  const addressValidation = validateAddress(address);
  if (!addressValidation.isValid) {
    throw new ValidationError('Invalid address', addressValidation.errors);
  }

  // Get current address
  const currentAddressQuery = `
    SELECT defaultaddress
    FROM consumers
    WHERE userid = $1
  `;

  const currentAddressResult = await query(currentAddressQuery, [userId]);

  if (currentAddressResult.rows.length === 0) {
    throw new NotFoundError('Consumer profile not found');
  }

  let currentAddress = currentAddressResult.rows[0].defaultaddress;
  
  // Parse existing address or create new one
  if (currentAddress) {
    try {
      currentAddress = JSON.parse(currentAddress);
    } catch (error) {
      currentAddress = {};
    }
  } else {
    currentAddress = {};
  }

  // Update address with new location data
  const updatedAddress = {
    ...currentAddress,
    ...address,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude)
  };

  // Update consumer profile with location
  const updateQuery = `
    UPDATE consumers 
    SET defaultaddress = $1, updatedat = CURRENT_TIMESTAMP
    WHERE userid = $2
    RETURNING *
  `;

  const result = await query(updateQuery, [JSON.stringify(updatedAddress), userId]);

  logger.info(`Customer location updated: userId=${userId}, lat=${latitude}, lng=${longitude}`);

  return responseHelper.success(res, {
    location: {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    },
    address: updatedAddress
  }, 'Location updated successfully');
});

// Update farmer profile
const updateFarmerProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { name, phone, farmname, description, farmingtype, location, deliveryradius, address } = req.body;

  // Validate coordinates if provided
  if (location && location.latitude && location.longitude) {
    if (!validateCoordinates(location.latitude, location.longitude)) {
      throw new ValidationError('Invalid coordinates provided');
    }
  }

  // Validate delivery radius
  if (deliveryradius && (deliveryradius < 1 || deliveryradius > 20)) {
    throw new ValidationError('Delivery radius must be between 1 and 20 km');
  }

  // Validate farming type
  if (farmingtype && !['organic', 'natural', 'mixed'].includes(farmingtype)) {
    throw new ValidationError('Invalid farming type');
  }

  // Update user basic info
  const userUpdateQuery = `
    UPDATE users 
    SET name = COALESCE($1, name), 
        phone = COALESCE($2, phone),
        updatedat = CURRENT_TIMESTAMP
    WHERE _id = $3
    RETURNING *
  `;

  await query(userUpdateQuery, [name, phone, userId]);

  // Update farmer profile
  const farmerUpdateQuery = `
    UPDATE farmers 
    SET 
      farmname = COALESCE($1, farmname),
      description = COALESCE($2, description),
      farmingtype = COALESCE($3, farmingtype),
      location = COALESCE($4, location),
      latitude = COALESCE($5, latitudeValue),
      longitude = COALESCE($6, longitudeValue),
      deliveryradius = COALESCE($7, deliveryradius),
      updatedat = CURRENT_TIMESTAMP
    WHERE userid = $8
    RETURNING *
  `;

  const locationObject = location ? createLocationObject(location.latitude, location.longitude) : null;
  const latitudeValue = location && location.latitude ? parseFloat(location.latitude) : null;
  const longitudeValue = location && location.longitude ? parseFloat(location.longitude) : null;

  const farmerResult = await query(farmerUpdateQuery, [
    farmname,
    description,
    farmingtype,
    locationObject,
    latitudeValue,
    longitudeValue,
    deliveryradius,
    userId
  ]);

  logger.info(`Farmer profile updated: userId=${userId}, farmname=${farmname}`);

  return responseHelper.success(res, {
    profile: farmerResult.rows[0],
    message: 'Profile updated successfully'
  });
});

// Get nearby farmers for a customer
const getNearbyFarmers = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { latitude, longitude, radius = 8 } = req.query;

  // Validate coordinates
  if (!latitude || !longitude || !validateCoordinates(latitude, longitude)) {
    throw new ValidationError('Valid latitude and longitude are required');
  }

  // Get all farmers with location data
  const farmersQuery = `
    SELECT 
      f._id,
      f.farmname,
      f.location,
      f.deliveryradius,
      f.verificationstatus,
      f.ratingaverage,
      f.totalreviews,
      u.name,
      u.email,
      u.phone
    FROM farmers f
    JOIN users u ON f.userid = u._id
    WHERE f.isapproved = true
      AND (f.location IS NOT NULL OR (f.latitude IS NOT NULL AND f.longitude IS NOT NULL))
  `;

  const farmersResult = await query(farmersQuery);

  // Filter and calculate distances
  const nearbyFarmers = farmersResult.rows.filter(farmer => {
    let farmerLat, farmerLng;
    
    // Use explicit coordinates if available, otherwise try to extract from PostGIS location
    if (farmer.latitude && farmer.longitude) {
      farmerLat = parseFloat(farmer.latitude);
      farmerLng = parseFloat(farmer.longitude);
    } else if (farmer.location && typeof farmer.location === 'object') {
      farmerLat = farmer.location.latitude;
      farmerLng = farmer.location.longitude;
    } else {
      return false; // Skip if no location data
    }
    
    const distance = calculateDistance(
      parseFloat(latitude),
      parseFloat(longitude),
      farmerLat,
      farmerLng
    );
    
    farmer.distance = distance;
    farmer.canDeliver = isWithinRadius(distance, farmer.deliveryradius || 8);
    
    return farmer.canDeliver;
  });

  // Sort by distance
  nearbyFarmers.sort((a, b) => a.distance - b.distance);

  // Limit results
  const limitedFarmers = nearbyFarmers.slice(0, 20);

  return responseHelper.success(res, {
    farmers: limitedFarmers,
    total: nearbyFarmers.length,
    searchRadius: parseFloat(radius)
  }, 'Nearby farmers retrieved successfully');
});

// Validate delivery to customer location
const validateDelivery = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { farmerId, customerLocation } = req.body;

  // Validate input
  if (!farmerId || !customerLocation) {
    throw new ValidationError('Farmer ID and customer location are required');
  }

  // Get farmer location
  const farmerQuery = `
    SELECT f._id, f.farmname, f.location, f.deliveryradius, f.latitude, f.longitude
    FROM farmers f
    WHERE f._id = $1
  `;

  const farmerResult = await query(farmerQuery, [farmerId]);

  if (farmerResult.rows.length === 0) {
    throw new NotFoundError('Farmer not found');
  }

  const farmer = farmerResult.rows[0];

  // Calculate distance
  let farmerLat, farmerLng;
  
  if (farmer.latitude && farmer.longitude) {
    farmerLat = parseFloat(farmer.latitude);
    farmerLng = parseFloat(farmer.longitude);
  } else if (farmer.location && typeof farmer.location === 'object') {
    farmerLat = farmer.location.latitude;
    farmerLng = farmer.location.longitude;
  } else {
    throw new NotFoundError('Farmer location not found');
  }

  const distance = calculateDistance(
    parseFloat(customerLocation.latitude),
    parseFloat(customerLocation.longitude),
    farmerLat,
    farmerLng
  );

  const canDeliver = isWithinRadius(distance, farmer.deliveryradius || 8);
  const deliveryRadius = farmer.deliveryradius || 8;

  const deliveryCharge = canDeliver ? calculateDeliveryCharge(distance) : 0;
  const deliveryTime = canDeliver ? getDeliveryTimeEstimate(distance) : null;

  const result = {
    canDeliver,
    distance: Math.round(distance * 100) / 100,
    deliveryRadius,
    deliveryCharge,
    deliveryTime,
    farmerName: farmer.farmname,
    customerLocation,
    farmerLocation: {
      latitude: farmerLat,
      longitude: farmerLng
    }
  };

  logger.info(`Delivery validation: userId=${userId}, farmerId=${farmerId}, canDeliver=${canDeliver}, distance=${distance}km`);

  return responseHelper.success(res, result, 'Delivery validation completed');
});

// Helper functions
const calculateDeliveryCharge = (distanceKm) => {
  if (distanceKm <= 3) return 0;
  if (distanceKm <= 5) return 20;
  if (distanceKm <= 8) return 40;
  return 60;
};

const getDeliveryTimeEstimate = (distanceKm) => {
  if (distanceKm <= 2) return '30-45 min';
  if (distanceKm <= 5) return '45-60 min';
  if (distanceKm <= 8) return '60-90 min';
  return '90-120 min';
};

module.exports = {
  getUserProfile,
  updateCustomerProfile,
  updateCustomerLocation,
  updateFarmerProfile,
  getNearbyFarmers,
  validateDelivery
};
