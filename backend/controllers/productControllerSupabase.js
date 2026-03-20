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
const supabase = require('../config/supabaseClient');

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
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  // Build the query
  let query = supabase
    .from('products')
    .select(`
      *,
      farmers!inner(
        userid,
        farmname,
        verificationstatus,
        ratingaverage,
        location,
        users!inner(
          name,
          email
        )
      )
    `, { count: 'exact' });

  // Apply filters
  if (category) {
    query = query.eq('category', category);
  }

  if (minPrice) {
    query = query.gte('priceperunit', parseFloat(minPrice));
  }

  if (maxPrice) {
    query = query.lte('priceperunit', parseFloat(maxPrice));
  }

  if (inStock === 'true') {
    query = query.gt('stockquantity', 0);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  query = query.range(offset, offset + limitNum - 1);

  const { data: products, error, count } = await query;

  if (error) {
    logger.error('Get products error:', error);
    throw new Error('Failed to fetch products');
  }

  // Apply location-based filtering if coordinates are provided
  let filteredProducts = products;
  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    if (!validateCoordinates(userLat, userLng)) {
      throw new ValidationError('Invalid coordinates provided');
    }

    filteredProducts = products.filter(product => {
      if (!product.farmers.location) return false;
      
      const farmerLocation = parseLocation(product.farmers.location);
      if (!farmerLocation) return false;

      return isWithinRadius(
        { latitude: userLat, longitude: userLng },
        farmerLocation,
        radiusKm * 1000 // Convert to meters
      );
    });
  }

  // Add distance information if location filtering is applied
  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    filteredProducts = filteredProducts.map(product => {
      if (product.farmers.location) {
        const farmerLocation = parseLocation(product.farmers.location);
        if (farmerLocation) {
          const distance = calculateDistance(
            { latitude: userLat, longitude: userLng },
            farmerLocation
          );
          product.distance = distance;
        }
      }
      return product;
    });
  }

  // Format response
  const formattedProducts = filteredProducts.map(product => ({
    _id: product._id,
    name: product.name,
    description: product.description,
    category: product.category,
    unit: product.unit,
    pricePerUnit: product.priceperunit,
    stockQuantity: product.stockquantity,
    minOrderQuantity: product.minorderquantity,
    images: product.images,
    isAvailable: product.isavailable,
    harvestDate: product.harvestdate,
    expiryDate: product.expirydate,
    createdAt: product.createdat,
    updatedAt: product.updatedat,
    farmer: {
      _id: product.farmers._id,
      userId: product.farmers.userid,
      farmName: product.farmers.farmname,
      verificationStatus: product.farmers.verificationstatus,
      ratingAverage: product.farmers.ratingaverage,
      location: product.farmers.location,
      user: {
        name: product.farmers.users.name,
        email: product.farmers.users.email
      }
    },
    distance: product.distance
  }));

  const response = responseHelper.custom(
    res,
    {
      success: true,
      message: 'Products retrieved successfully',
      data: formattedProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredProducts.length,
        pages: Math.ceil(filteredProducts.length / limitNum),
        hasNext: pageNum * limitNum < filteredProducts.length,
        hasPrev: pageNum > 1
      },
      filters: {
        category,
        minPrice,
        maxPrice,
        search,
        inStock,
        location: lat && lng ? { lat, lng, radius } : null
      }
    }
  );

  return response;
});

// Get featured products
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;
  const limitNum = parseInt(limit);

  try {
    // First try a simpler query to check if products exist
    const { data: allProducts, error: testError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (testError) {
      logger.error('Test query error:', testError);
      throw new Error(`Database query failed: ${testError.message}`);
    }

    logger.info('Products query test passed, found products:', allProducts.length);

    // Now get featured products with joins
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        farmers!inner(
          userid,
          farmname,
          verificationstatus,
          ratingaverage,
          location,
          users!inner(
            name,
            email
          )
        )
      `)
      .eq('isavailable', true)
      .eq('isfeatured', true)
      .gt('stockquantity', 0)
      .order('createdat', { ascending: false })
      .limit(limitNum);

    if (error) {
      logger.error('Get featured products error:', error);
      throw new Error(`Failed to fetch featured products: ${error.message}`);
    }

    logger.info('Featured products query successful, found:', products.length);

    // If no featured products, get some regular products as fallback
    let finalProducts = products;
    if (products.length === 0) {
      const { data: fallbackProducts, error: fallbackError } = await supabase
        .from('products')
        .select(`
          *,
          farmers!inner(
            userid,
            farmname,
            verificationstatus,
            ratingaverage,
            location,
            users!inner(
              name,
              email
            )
          )
        `)
        .eq('isavailable', true)
        .gt('stockquantity', 0)
        .order('createdat', { ascending: false })
        .limit(limitNum);

      if (fallbackError) {
        logger.error('Fallback query error:', fallbackError);
        throw new Error(`Failed to fetch products: ${fallbackError.message}`);
      }

      finalProducts = fallbackProducts;
      logger.info('Using fallback products, found:', finalProducts.length);
    }

    // Format response
    const formattedProducts = finalProducts.map(product => ({
      _id: product._id,
      name: product.name,
      description: product.description,
      category: product.category,
      unit: product.unit,
      pricePerUnit: product.priceperunit,
      stockQuantity: product.stockquantity,
      minOrderQuantity: product.minorderquantity,
      images: product.images,
      isAvailable: product.isavailable,
      harvestDate: product.harvestdate,
      expiryDate: product.expirydate,
      createdAt: product.createdat,
      updatedAt: product.updatedat,
      farmer: {
        _id: product.farmers._id,
        userId: product.farmers.userid,
        farmName: product.farmers.farmname,
        verificationStatus: product.farmers.verificationstatus,
        ratingAverage: product.farmers.ratingaverage,
        location: product.farmers.location,
        user: {
          name: product.farmers.users.name,
          email: product.farmers.users.email
        }
      }
    }));

    const response = responseHelper.success(
      res,
      formattedProducts,
      'Featured products retrieved successfully'
    );

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get featured products error:', error);
    throw error;
  }
});

// Get product by ID
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      farmers!inner(
        userid,
        farmname,
        verificationstatus,
        ratingaverage,
        location,
        description as farmerDescription,
        users!inner(
          name,
          email
        )
      )
    `)
    .eq('_id', id)
    .single();

  if (error || !product) {
    throw new NotFoundError('Product not found');
  }

  // Format response
  const formattedProduct = {
    _id: product._id,
    name: product.name,
    description: product.description,
    category: product.category,
    unit: product.unit,
    pricePerUnit: product.priceperunit,
    stockQuantity: product.stockquantity,
    minOrderQuantity: product.minorderquantity,
    images: product.images,
    isAvailable: product.isavailable,
    harvestDate: product.harvestdate,
    expiryDate: product.expirydate,
    createdAt: product.createdat,
    updatedAt: product.updatedat,
    farmer: {
      _id: product.farmers._id,
      userId: product.farmers.userid,
      farmName: product.farmers.farmname,
      verificationStatus: product.farmers.verificationstatus,
      ratingAverage: product.farmers.ratingaverage,
      location: product.farmers.location,
      description: product.farmers.farmerDescription,
      user: {
        name: product.farmers.users.name,
        email: product.farmers.users.email
      }
    }
  };

  const response = responseHelper.success(
    res,
    formattedProduct,
    'Product retrieved successfully'
  );

  res.status(200).json(response);
});

// Get products by farmer
const getProductsByFarmer = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;
  const { 
    category, 
    minPrice, 
    maxPrice, 
    search, 
    sortBy = 'createdat', 
    sortOrder = 'desc',
    page = 1,
    limit = 10,
    inStock
  } = req.query;

  // Validate and parse pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  // Build the query
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('farmerid', farmerId);

  // Apply filters
  if (category) {
    query = query.eq('category', category);
  }

  if (minPrice) {
    query = query.gte('priceperunit', parseFloat(minPrice));
  }

  if (maxPrice) {
    query = query.lte('priceperunit', parseFloat(maxPrice));
  }

  if (inStock === 'true') {
    query = query.gt('stockquantity', 0);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  query = query.range(offset, offset + limitNum - 1);

  const { data: products, error, count } = await query;

  if (error) {
    logger.error('Get products by farmer error:', error);
    throw new Error('Failed to fetch products');
  }

  // Format response
  const formattedProducts = products.map(product => ({
    _id: product._id,
    name: product.name,
    description: product.description,
    category: product.category,
    unit: product.unit,
    pricePerUnit: product.priceperunit,
    stockQuantity: product.stockquantity,
    minOrderQuantity: product.minorderquantity,
    images: product.images,
    isAvailable: product.isavailable,
    harvestDate: product.harvestdate,
    expiryDate: product.expirydate,
    createdAt: product.createdat,
    updatedAt: product.updatedat
  }));

  const response = responseHelper.custom(
    res,
    {
      success: true,
      message: 'Products retrieved successfully',
      data: formattedProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        pages: Math.ceil(count / limitNum),
        hasNext: offset + limitNum < count,
        hasPrev: pageNum > 1
      },
      filters: {
        farmerId,
        category,
        minPrice,
        maxPrice,
        search,
        inStock
      }
    }
  );

  res.status(200).json(response);
});

// Get product categories
const getCategories = asyncHandler(async (req, res) => {
  const { data: categories, error } = await supabase
    .from('products')
    .select('category')
    .not('category', 'is', null);

  if (error) {
    logger.error('Get categories error:', error);
    throw new Error('Failed to fetch categories');
  }

  // Get unique categories
  const uniqueCategories = [...new Set(categories.map(item => item.category))];

  const response = responseHelper.success(
    res,
    uniqueCategories,
    'Categories retrieved successfully'
  );

  res.status(200).json(response);
});

// Search products
const searchProducts = asyncHandler(async (req, res) => {
  const { q: query, category, minPrice, maxPrice, lat, lng, radius = 10 } = req.query;

  if (!query) {
    throw new ValidationError('Search query is required');
  }

  // Build the search query
  let supabaseQuery = supabase
    .from('products')
    .select(`
      *,
      farmers!inner(
        userid,
        farmname,
        verificationstatus,
        ratingaverage,
        location,
        users!inner(
          name,
          email
        )
      )
    `)
    .eq('isavailable', true)
    .gt('stockquantity', 0)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

  // Apply additional filters
  if (category) {
    supabaseQuery = supabaseQuery.eq('category', category);
  }

  if (minPrice) {
    supabaseQuery = supabaseQuery.gte('priceperunit', parseFloat(minPrice));
  }

  if (maxPrice) {
    supabaseQuery = supabaseQuery.lte('priceperunit', parseFloat(maxPrice));
  }

  const { data: products, error } = await supabaseQuery;

  if (error) {
    logger.error('Search products error:', error);
    throw new Error('Failed to search products');
  }

  // Apply location-based filtering if coordinates are provided
  let filteredProducts = products;
  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    if (!validateCoordinates(userLat, userLng)) {
      throw new ValidationError('Invalid coordinates provided');
    }

    filteredProducts = products.filter(product => {
      if (!product.farmers.location) return false;
      
      const farmerLocation = parseLocation(product.farmers.location);
      if (!farmerLocation) return false;

      return isWithinRadius(
        { latitude: userLat, longitude: userLng },
        farmerLocation,
        radiusKm * 1000
      );
    });
  }

  // Add distance information
  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    filteredProducts = filteredProducts.map(product => {
      if (product.farmers.location) {
        const farmerLocation = parseLocation(product.farmers.location);
        if (farmerLocation) {
          const distance = calculateDistance(
            { latitude: userLat, longitude: userLng },
            farmerLocation
          );
          product.distance = distance;
        }
      }
      return product;
    });
  }

  // Format response
  const formattedProducts = filteredProducts.map(product => ({
    _id: product._id,
    name: product.name,
    description: product.description,
    category: product.category,
    unit: product.unit,
    pricePerUnit: product.priceperunit,
    stockQuantity: product.stockquantity,
    minOrderQuantity: product.minorderquantity,
    images: product.images,
    isAvailable: product.isavailable,
    harvestDate: product.harvestdate,
    expiryDate: product.expirydate,
    createdAt: product.createdat,
    updatedAt: product.updatedat,
    farmer: {
      _id: product.farmers._id,
      userId: product.farmers.userid,
      farmName: product.farmers.farmname,
      verificationStatus: product.farmers.verificationstatus,
      ratingAverage: product.farmers.ratingaverage,
      location: product.farmers.location,
      user: {
        name: product.farmers.users.name,
        email: product.farmers.users.email
      }
    },
    distance: product.distance
  }));

  const response = responseHelper.custom(
    res,
    {
      success: true,
      message: 'Products searched successfully',
      data: formattedProducts,
      query,
      filters: {
        category,
        minPrice,
        maxPrice,
        location: lat && lng ? { lat, lng, radius } : null
      },
      total: filteredProducts.length
    }
  );

  res.status(200).json(response);
});

// Get nearby products based on location
const getNearbyProducts = asyncHandler(async (req, res) => {
  try {
    const { lat, lng, latitude, longitude, radius = 50 } = req.query;
    
    // Handle both parameter naming conventions
    const latitudeValue = lat || latitude;
    const longitudeValue = lng || longitude;
    
    if (!latitudeValue || !longitudeValue) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required for nearby products search'
      });
    }

    // Validate coordinates
    if (!validateCoordinates(latitudeValue, longitudeValue)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided'
      });
    }

    // Get all products with farmer information
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        farmers!inner(
          userid,
          farmname,
          verificationstatus,
          ratingaverage,
          latitude,
          longitude,
          location,
          users!inner(
            name,
            email
          )
        )
      `);

    if (error) {
      logger.error('Error fetching products for nearby search:', error);
      throw error;
    }

    logger.info(`Found ${products.length} total products`);

    // Filter products based on location
    const nearbyProducts = products.filter(product => {
      // Check if farmer has location data (either new lat/lng fields or PostGIS location)
      const hasLocation = product.farmers?.latitude && product.farmers?.longitude;
      const hasPostGISLocation = product.farmers?.location;
      
      if (!hasLocation && !hasPostGISLocation) {
        logger.warn(`Farmer ${product.farmers.userid} has no location data`);
        return false;
      }
      
      // Use explicit lat/lng if available, otherwise try to extract from PostGIS location
      let farmerLat, farmerLng;
      if (hasLocation) {
        farmerLat = parseFloat(product.farmers.latitude);
        farmerLng = parseFloat(product.farmers.longitude);
      } else if (hasPostGISLocation && product.farmers.location) {
        // Try to extract from PostGIS location object
        if (typeof product.farmers.location === 'object') {
          farmerLat = product.farmers.location.latitude;
          farmerLng = product.farmers.location.longitude;
        } else {
          // Skip if we can't parse location
          logger.warn(`Cannot parse location for farmer ${product.farmers.userid}`);
          return false;
        }
      }
      
      const distance = calculateDistance(
        parseFloat(latitudeValue),
        parseFloat(longitudeValue),
        farmerLat,
        farmerLng
      );
      
      logger.info(`Distance to ${product.name}: ${distance.toFixed(2)}km`);
      
      return isWithinRadius(distance, parseFloat(radius));
    });

    logger.info(`Found ${nearbyProducts.length} nearby products within ${radius}km`);

    // Sort by distance (closest first)
    nearbyProducts.sort((a, b) => {
      // Get location for product A
      let farmerLatA, farmerLngA;
      if (a.farmers?.latitude && a.farmers?.longitude) {
        farmerLatA = parseFloat(a.farmers.latitude);
        farmerLngA = parseFloat(a.farmers.longitude);
      } else if (a.farmers?.location && typeof a.farmers.location === 'object') {
        farmerLatA = a.farmers.location.latitude;
        farmerLngA = a.farmers.location.longitude;
      }
      
      // Get location for product B
      let farmerLatB, farmerLngB;
      if (b.farmers?.latitude && b.farmers?.longitude) {
        farmerLatB = parseFloat(b.farmers.latitude);
        farmerLngB = parseFloat(b.farmers.longitude);
      } else if (b.farmers?.location && typeof b.farmers.location === 'object') {
        farmerLatB = b.farmers.location.latitude;
        farmerLngB = b.farmers.location.longitude;
      }
      
      const distanceA = calculateDistance(
        parseFloat(latitudeValue),
        parseFloat(longitudeValue),
        farmerLatA,
        farmerLngA
      );
      const distanceB = calculateDistance(
        parseFloat(latitudeValue),
        parseFloat(longitudeValue),
        farmerLatB,
        farmerLngB
      );
      return distanceA - distanceB;
    });

    return res.status(200).json({
      success: true,
      data: nearbyProducts,
      message: `Found ${nearbyProducts.length} nearby products within ${radius}km`
    });

  } catch (error) {
    logger.error('Get nearby products error:', error);
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby products',
      error: error.message
    });
  }
});

module.exports = {
  getProducts,
  getFeaturedProducts,
  getProductById,
  getProductsByFarmer,
  getCategories,
  searchProducts,
  getNearbyProducts
};
