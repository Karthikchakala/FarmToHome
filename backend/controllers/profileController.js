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
const supabase = require('../config/supabaseClient');

// Get user profile
const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;

  try {
    let profileData;

    if (userRole === 'consumer') {
      // Get consumer profile using Supabase
      console.log('Fetching consumer profile for userId:', userId);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          _id,
          name,
          email,
          phone,
          role,
          createdat
        `)
        .eq('_id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user:', userError);
        logger.error('Error fetching user profile:', userError);
        throw new Error(`Failed to fetch user profile: ${userError.message}`);
      }

      profileData = userData;

      // Get consumer data separately
      if (profileData) {
        let { data: consumerData, error: consumerError } = await supabase
          .from('consumers')
          .select(`
            _id,
            defaultaddressstreet,
            defaultaddresscity,
            defaultaddressstate,
            defaultaddresspostalcode,
            defaultaddresslocation,
            walletbalance,
            totalorders,
            createdat,
            updatedat,
            consumerid,
            latitude,
            longitude
          `)
          .eq('userid', userId)
          .single();

        console.log('Consumer data fetch result:', { data: consumerData, error: consumerError });

        if (consumerError && consumerError.code !== 'PGRST116') {
          console.error('Error fetching consumer data:', consumerError);
          logger.error('Error fetching consumer data:', consumerError);
          throw new Error(`Failed to fetch consumer data: ${consumerError.message}`);
        }

        // Reconstruct address object
        if (consumerData) {
          consumerData.defaultaddress = {
            street: consumerData.defaultaddressstreet,
            city: consumerData.defaultaddresscity,
            state: consumerData.defaultaddressstate,
            pincode: consumerData.defaultaddresspostalcode,
            latitude: consumerData.latitude,
            longitude: consumerData.longitude
          };
        } else {
          // Create empty consumer data if none exists
          consumerData = {
            defaultaddress: {
              street: null,
              city: null,
              state: null,
              pincode: null,
              latitude: null,
              longitude: null
            }
          };
        }

        profileData.consumers = consumerData;
      }

    } else if (userRole === 'farmer') {
      // Get farmer profile using Supabase
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          farmers!left(
            _id as farmer_id,
            farmname,
            description,
            farmingtype,
            location,
            latitude,
            longitude,
            deliveryradius,
            isapproved,
            verificationstatus,
            ratingaverage,
            createdat as farmer_created_at
          )
        `)
        .eq('_id', userId)
        .single();

      if (userError) {
        logger.error('Error fetching user profile:', userError);
        throw new Error('Failed to fetch user profile');
      }

      profileData = userData;

      // Parse location if exists
      if (profileData.farmers?.location) {
        profileData.farmers.location = parseLocation(profileData.farmers.location);
      }

    } else {
      // Admin profile - just get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('_id, name, email, phone, role, createdat')
        .eq('_id', userId)
        .single();

      if (userError) {
        logger.error('Error fetching user profile:', userError);
        throw new Error('Failed to fetch user profile');
      }

      profileData = userData;
    }

    return responseHelper.success(res, profileData, 'Profile retrieved successfully');

  } catch (error) {
    logger.error('Get user profile error:', error);
    console.error('Profile API 500 Error:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
});

// Update customer profile
const updateCustomerProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { name, phone } = req.body;

  try {
    // Update user basic info using Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({
        name: name || undefined,
        phone: phone || undefined,
        updatedat: new Date().toISOString()
      })
      .eq('_id', userId)
      .select()
      .single();

    if (userError) {
      logger.error('Error updating customer profile:', userError);
      throw new Error('Failed to update customer profile');
    }

    return responseHelper.success(res, { 
      user: userData,
      message: 'Profile updated successfully' 
    });

  } catch (error) {
    logger.error('Update customer profile error:', error);
    throw error;
  }
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
  const addressValidation = validateAddress({
    home: address?.street || address?.home || null,
    street: address?.street || null,
    city: address?.city || null,
    state: address?.state || null,
    pincode: address?.pincode || null
  });
  if (!addressValidation.isValid) {
    throw new ValidationError('Invalid address', addressValidation.errors);
  }

  try {
    // Get current consumer profile
    const { data: currentConsumer, error: fetchError } = await supabase
      .from('consumers')
      .select(`
        defaultaddressstreet,
        defaultaddresscity,
        defaultaddressstate,
        defaultaddresspostalcode,
        latitude,
        longitude
      `)
      .eq('userid', userId)
      .single();

    console.log('Current consumer fetch:', { data: currentConsumer, error: fetchError });

    if (fetchError && fetchError.code !== 'PGRST116') {
      logger.error('Error fetching consumer profile:', fetchError);
      throw new Error(`Failed to fetch consumer profile: ${fetchError.message}`);
    }

    // Parse existing address or create new one
    let currentAddress = {};
    if (currentConsumer) {
      currentAddress = {
        street: currentConsumer.defaultaddressstreet,
        city: currentConsumer.defaultaddresscity,
        state: currentConsumer.defaultaddressstate,
        pincode: currentConsumer.defaultaddresspostalcode,
        latitude: currentConsumer.latitude,
        longitude: currentConsumer.longitude
      };
    }

    // Update address with new location data
    const updatedAddress = {
      ...currentAddress,
      street: address?.street || currentAddress.street,
      city: address?.city || currentAddress.city,
      state: address?.state || currentAddress.state,
      pincode: address?.pincode || currentAddress.pincode,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    };

    // Update or create consumer profile with location
    const { data: consumerData, error: updateError } = await supabase
      .from('consumers')
      .upsert({
        userid: userId,
        defaultaddressstreet: address?.street || null,
        defaultaddresscity: address?.city || null,
        defaultaddressstate: address?.state || null,
        defaultaddresspostalcode: address?.pincode || null,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        updatedat: new Date().toISOString()
      }, { onConflict: 'userid' })  // Specify conflict column
      .select(`
        _id,
        defaultaddressstreet,
        defaultaddresscity,
        defaultaddressstate,
        defaultaddresspostalcode,
        latitude,
        longitude,
        createdat,
        updatedat
      `)
      .single();

    if (updateError) {
      logger.error('Error updating customer location:', updateError);
      console.error('Profile update error:', updateError);
      console.error('Error message:', updateError.message);
      console.error('Error details:', updateError.details);
      throw new Error(`Failed to update customer location: ${updateError.message}`);
    }

    logger.info(`Customer location updated: userId=${userId}, lat=${latitude}, lng=${longitude}`);

    return responseHelper.success(res, {
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      address: {
        street: address?.street,
        city: address?.city,
        state: address?.state,
        pincode: address?.pincode
      },
      consumer: consumerData,
      message: 'Location updated successfully'
    });

  } catch (error) {
    logger.error('Update customer location error:', error);
    throw error;
  }
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

  try {
    // Update user basic info using Supabase
    const userUpdateData = {};
    if (name) userUpdateData.name = name;
    if (phone) userUpdateData.phone = phone;
    userUpdateData.updatedat = new Date().toISOString();

    console.log('Updating user with data:', userUpdateData);
    const { data: userData, error: userError } = await supabase
      .from('users')
      .update(userUpdateData)
      .eq('_id', userId)
      .select()
      .single();

    if (userError) {
      console.error('Error updating user:', userError);
      logger.error('Error updating user:', userError);
      throw new Error(`Failed to update user profile: ${userError.message}`);
    }

    // Update farmer profile using Supabase
    const farmerUpdateData = {};
    if (farmname) farmerUpdateData.farmname = farmname;
    if (description) farmerUpdateData.description = description;
    if (farmingtype) farmerUpdateData.farmingtype = farmingtype;
    if (deliveryradius) farmerUpdateData.deliveryradius = deliveryradius;
    
    // Handle location data
    if (location && location.latitude && location.longitude) {
      // Only store latitude and longitude, skip the location field for now
      farmerUpdateData.latitude = parseFloat(location.latitude);
      farmerUpdateData.longitude = parseFloat(location.longitude);
    }
    
    farmerUpdateData.updatedat = new Date().toISOString();

    console.log('Updating farmer with data:', farmerUpdateData);
    const { data: farmerData, error: farmerError } = await supabase
      .from('farmers')
      .update(farmerUpdateData)
      .eq('userid', userId)
      .select()
      .single();

    if (farmerError) {
      console.error('Error updating farmer:', farmerError);
      logger.error('Error updating farmer:', farmerError);
      throw new Error(`Failed to update farmer profile: ${farmerError.message}`);
    }

    console.log('Successfully updated farmer profile:', farmerData);
    logger.info(`Farmer profile updated: userId=${userId}, farmname=${farmname}`);

    return responseHelper.success(res, {
      profile: farmerData,
      user: userData,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update farmer profile error:', error);
    logger.error('Update farmer profile error:', error);
    throw error;
  }
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
