const supabase = require('../config/supabaseClient');
const logger = require('../config/logger');
const responseHelper = require('../utils/responseHelper');
const { asyncHandler, NotFoundError, ValidationError } = require('../middlewares/enhancedErrorHandler');
const { validateProductPrice } = require('./costChartController');
const { uploadImages, getImageUrl, getImageUrls, deleteImages, extractFilenames } = require('../middlewares/upload');

// Helper function to check table schema
const checkTableSchema = asyncHandler(async (req, res) => {
  const { data: columns, error } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_name', 'products')
    .eq('table_schema', 'public')
    .order('ordinal_position');

  if (error) {
    return responseHelper.error(res, 'Failed to get table schema', 500, error);
  }

  return responseHelper.success(res, {
    tableName: 'products',
    columns: columns || []
  }, 'Table schema retrieved successfully');
});

// Add product (Farmer only)
const addProduct = [
  uploadImages,
  asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {
      name,
      description,
      category,
      price,
      unit,
      stockQuantity,
      minimumOrder,
      images = [],
      isAvailable = true,
      harvestDate,
      expiryDate,
      shelfLife // Shelf life in days
    } = req.body;

    console.log('addProduct called with userId:', userId);

    // Handle uploaded files
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      uploadedImages = req.files.map(file => getImageUrl(file.filename));
    }

    // Combine uploaded images with any existing image URLs
    const allImages = [...uploadedImages, ...(Array.isArray(images) ? images : [])];

    // Get the actual farmerid from farmers table
    const { data: farmerRecord, error: farmerError } = await supabase
      .from('farmers')
      .select('_id, isapproved, verificationstatus')
      .eq('userid', userId)
      .single();

    if (farmerError || !farmerRecord) {
      console.log('Farmer record not found:', farmerError);
      throw new NotFoundError('Farmer record not found');
    }

    console.log('Found farmer record:', farmerRecord);
    console.log('Farmer approval check:', {
      isapproved: farmerRecord.isapproved,
      verificationstatus: farmerRecord.verificationstatus,
      willPass: farmerRecord.isapproved || farmerRecord.verificationstatus === 'approved'
    });

    if (!farmerRecord.isapproved && farmerRecord.verificationstatus !== 'approved') {
      console.log('Farmer NOT approved - throwing error');
      throw new ValidationError('Farmer account is not approved');
    }

    console.log('Farmer APPROVED - continuing...');

    // Validate input
    if (!name || !description || !category || !price || !unit || stockQuantity === undefined) {
      throw new ValidationError('All required fields must be provided');
    }

    // Validate price and stock
    if (parseFloat(price) <= 0) {
      throw new ValidationError('Price must be greater than 0');
    }

    if (parseInt(stockQuantity) < 0) {
      throw new ValidationError('Stock quantity cannot be negative');
    }

    // Validate unit against allowed values
    const allowedUnits = ['kg', 'gram', 'litre', 'piece'];
    if (!allowedUnits.includes(unit)) {
      throw new ValidationError(`Unit must be one of: ${allowedUnits.join(', ')}`);
    }

    // Validate price against cost chart
    const priceValidation = await validateProductPrice(name, parseFloat(price));
    if (!priceValidation.valid) {
      throw new ValidationError(priceValidation.message);
    }

    // Validate shelf life
    let shelfLifeExpiry = null;
    if (shelfLife !== undefined && shelfLife !== null) {
      if (parseInt(shelfLife) <= 0) {
        throw new ValidationError('Shelf life must be greater than 0 days');
      }
      if (parseInt(shelfLife) > 365) {
        throw new ValidationError('Shelf life cannot exceed 365 days');
      }
      
      // Calculate shelf life expiry from current date
      const shelfLifeExpiryDate = new Date();
      shelfLifeExpiryDate.setDate(shelfLifeExpiryDate.getDate() + parseInt(shelfLife));
      shelfLifeExpiry = shelfLifeExpiryDate.toISOString();
    }

    // Create product using Supabase with correct farmerid
    const productData = {
      farmerid: farmerRecord._id, // Use _id from farmers table
      name,
      description,
      category,
      priceperunit: parseFloat(price),
      unit,
      stockquantity: parseInt(stockQuantity),
      minorderquantity: parseInt(minimumOrder) || 1,
      images: allImages, // Use the combined images array
      isavailable: isAvailable,
      harvestdate: harvestDate || null,
      expirydate: expiryDate || null,
      shelf_life: shelfLife ? parseInt(shelfLife) : null,
      shelf_life_expiry: shelfLifeExpiry
    };

    console.log('Product data prepared for Supabase:', productData);

    const { data: product, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    console.log('Supabase insert response:', { product, error: error?.message });

    if (error) {
      logger.error('Add product error:', error);
      throw new Error('Failed to add product: ' + error.message);
    }

    return responseHelper.success(res, {
      product: {
        ...product,
        images: product.images || []
      }
    }, 'Product added successfully');
  })
];

// Update product (Farmer only)
const updateProduct = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;
  const {
    name,
    description,
    category,
    priceperunit,
    unit,
    stockquantity,
    images,
    isavailable
  } = req.body;

  // Validate product ID
  if (!productId) {
    throw new ValidationError('Product ID is required');
  }

  // Get farmer ID
  const farmerQuery = 'SELECT _id FROM farmers WHERE _id = $1 AND isapproved = true';
  const farmerResult = await query(farmerQuery, [userId]);

  if (farmerResult.rows.length === 0) {
    throw new NotFoundError('Farmer profile not found or not approved');
  }

  const farmerId = farmerResult.rows[0]._id;

  // Check if product exists and belongs to farmer
  const productCheckQuery = 'SELECT _id FROM products WHERE _id = $1 AND farmerid = $2';
  const productCheckResult = await query(productCheckQuery, [productId, farmerId]);

  if (productCheckResult.rows.length === 0) {
    throw new NotFoundError('Product not found or access denied');
  }

  // Build update query dynamically
  const updateFields = [];
  const updateValues = [];
  let paramIndex = 1;

  if (name !== undefined) {
    updateFields.push(`name = $${paramIndex++}`);
    updateValues.push(name);
  }

  if (description !== undefined) {
    updateFields.push(`description = $${paramIndex++}`);
    updateValues.push(description);
  }

  if (category !== undefined) {
    updateFields.push(`category = $${paramIndex++}`);
    updateValues.push(category);
  }

  if (priceperunit !== undefined) {
    if (parseFloat(priceperunit) <= 0) {
      throw new ValidationError('Price must be greater than 0');
    }
    updateFields.push(`priceperunit = $${paramIndex++}`);
    updateValues.push(parseFloat(priceperunit));
  }

  if (unit !== undefined) {
    updateFields.push(`unit = $${paramIndex++}`);
    updateValues.push(unit);
  }

  if (stockquantity !== undefined) {
    if (parseInt(stockquantity) < 0) {
      throw new ValidationError('Stock quantity cannot be negative');
    }
    updateFields.push(`stockquantity = $${paramIndex++}`);
    updateValues.push(parseInt(stockquantity));
  }

  if (images !== undefined) {
    updateFields.push(`images = $${paramIndex++}`);
    updateValues.push(JSON.stringify(images));
  }

  if (isavailable !== undefined) {
    updateFields.push(`isavailable = $${paramIndex++}`);
    updateValues.push(isavailable);
  }

  if (updateFields.length === 0) {
    throw new ValidationError('No fields to update');
  }

  // Add updated timestamp and product ID
  updateFields.push(`updatedat = CURRENT_TIMESTAMP`);
  updateValues.push(productId);

  const updateQuery = `
    UPDATE products 
    SET ${updateFields.join(', ')}
    WHERE _id = $${paramIndex}
    RETURNING *
  `;

  const updateResult = await query(updateQuery, updateValues);
  const updatedProduct = updateResult.rows[0];

  logger.info(`Product updated: productId=${productId}, farmerId=${farmerId}`);

  return responseHelper.success(res, {
    ...updatedProduct,
    images: updatedProduct.images ? JSON.parse(updatedProduct.images) : []
  }, 'Product updated successfully');
});
// Update stock quantity (Farmer only)
const updateStock = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { stockquantity, priceperunit } = req.body;

  // Validate input
  if (stockquantity === undefined || stockquantity < 0) {
    throw new ValidationError('Valid stock quantity is required');
  }

  // Get farmer ID by userid
  const { data: farmer, error: farmerError } = await supabase
    .from('farmers')
    .select('_id, isapproved')
    .eq('userid', userId)
    .single();

  if (farmerError || !farmer) {
    throw new NotFoundError('Farmer profile not found or not approved');
  }

  if (!farmer.isapproved) {
    throw new NotFoundError('Farmer profile not approved');
  }

  const farmerId = farmer._id;

  // Check if product exists and belongs to farmer
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('_id')
    .eq('_id', id)
    .eq('farmerid', farmerId)
    .single();

  if (productError || !product) {
    throw new NotFoundError('Product not found or access denied');
  }

  // Update stock quantity and price
  const updateData = { stockquantity };
  if (priceperunit !== undefined) updateData.priceperunit = priceperunit;

  const { data: updatedProduct, error: updateError } = await supabase
    .from('products')
    .update(updateData)
    .eq('_id', id)
    .select()
    .single();

  if (updateError) {
    throw new Error('Failed to update stock');
  }

  return responseHelper.success(res, updatedProduct, 'Stock updated successfully');
});

// Toggle product availability (Farmer only)
const toggleAvailability = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;
  const { isAvailable } = req.body;

  // Validate input
  if (typeof isAvailable !== 'boolean') {
    throw new ValidationError('isAvailable must be a boolean value');
  }

  // Get the actual farmerid from farmers table
  const { data: farmerRecord, error: farmerError } = await supabase
    .from('farmers')
    .select('_id, isapproved, verificationstatus')
    .eq('userid', userId)
    .single();

  if (farmerError || !farmerRecord) {
    console.log('Farmer record not found:', farmerError);
    throw new NotFoundError('Farmer record not found');
  }

  // Update product availability using actual farmerid
  const { data: product, error } = await supabase
    .from('products')
    .update({ isavailable: isAvailable })
    .eq('_id', productId)
    .eq('farmerid', farmerRecord._id) // ✅ Use _id from farmers table
    .select()
    .single();

  if (error) {
    logger.error('Toggle availability error:', error);
    throw new Error('Failed to update product availability');
  }

  if (!product) {
    throw new NotFoundError('Product not found or access denied');
  }

  return responseHelper.success(res, {
    product: {
      ...product,
      images: product.images || []
    }
  }, `Product marked as ${isAvailable ? 'available' : 'unavailable'} successfully`);
});

// Get farmer products with stock info
const getFarmerProducts = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, category, isavailable } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  console.log('getFarmerProducts called with userId:', userId);

  // Get the actual farmerid from farmers table
  const { data: farmerRecord, error: farmerError } = await supabase
    .from('farmers')
    .select('_id, isapproved, verificationstatus')
    .eq('userid', userId)
    .single();

  if (farmerError || !farmerRecord) {
    console.log('Farmer record not found:', farmerError);
    throw new NotFoundError('Farmer record not found');
  }

  console.log('Found farmer record:', farmerRecord);

  // Get farmer products using the actual farmerid
  let supabaseQuery = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('farmerid', farmerRecord._id) // ✅ Use _id from farmers table
    .order('createdat', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  // Apply filters
  if (category) {
    supabaseQuery = supabaseQuery.eq('category', category);
  }

  if (isavailable !== undefined) {
    supabaseQuery = supabaseQuery.eq('isavailable', isavailable === 'true');
  }

  const { data: products, error, count } = await supabaseQuery;

  console.log('Supabase response:', { 
    productsCount: products?.length || 0, 
    totalCount: count, 
    error: error?.message 
  });

  if (error) {
    logger.error('Get farmer products error:', error);
    throw new Error('Failed to fetch products');
  }

  return responseHelper.success(res, {
    products: products || [],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count || 0,
      pages: Math.ceil((count || 0) / parseInt(limit))
    }
  }, 'Farmer products retrieved successfully');
});

// Get low stock alerts for farmer
const getLowStockAlerts = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { threshold = 10 } = req.query;

  // Get farmer ID by userid (not _id)
  const { data: farmer, error: farmerError } = await supabase
    .from('farmers')
    .select('_id, isapproved')
    .eq('userid', userId)
    .single();

  if (farmerError || !farmer) {
    // Check if user exists and is farmer
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('_id, email, role')
      .eq('_id', userId)
      .single();
    
    if (userError || !user) {
      throw new NotFoundError('User not found');
    }
    
    if (user.role !== 'farmer') {
      throw new NotFoundError('User is not a farmer');
    }
    
    throw new NotFoundError('Farmer profile not found. Please complete your farmer registration.');
  }

  if (!farmer.isapproved) {
    throw new NotFoundError('Farmer profile not approved. Please wait for admin approval.');
  }

  const farmerId = farmer._id;

  // Get products with low stock
  const { data: lowStockProducts, error: lowStockError } = await supabase
    .from('products')
    .select(`
      _id,
      name,
      category,
      stockquantity,
      unit,
      priceperunit
    `)
    .eq('farmerid', farmerId)
    .lte('stockquantity', threshold)
    .gt('stockquantity', 0)
    .order('stockquantity', { ascending: true });

  if (lowStockError) {
    throw new Error(`Failed to fetch low stock alerts: ${lowStockError.message}`);
  }

  // If no products found, return empty array
  if (!lowStockProducts || lowStockProducts.length === 0) {
    return responseHelper.success(res, [], 'No low stock alerts found');
  }

  const alerts = lowStockProducts.map(product => ({
    _id: product._id,
    productName: product.name,
    category: product.category,
    currentStock: product.stockquantity,
    unit: product.unit,
    pricePerUnit: product.priceperunit,
    minStockAlert: threshold, // Use threshold since minstockalert column doesn't exist
    threshold: parseInt(threshold)
  }));

  return responseHelper.success(res, alerts, 'Low stock alerts retrieved successfully');
});

// Get stock statistics for farmer
const getStockStatistics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get farmer ID by userid (not _id)
  const { data: farmer, error: farmerError } = await supabase
    .from('farmers')
    .select('_id, isapproved')
    .eq('userid', userId)
    .single();

  if (farmerError || !farmer) {
    // Check if user exists and is farmer
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('_id, email, role')
      .eq('_id', userId)
      .single();
    
    if (userError || !user) {
      throw new NotFoundError('User not found');
    }
    
    if (user.role !== 'farmer') {
      throw new NotFoundError('User is not a farmer');
    }
    
    throw new NotFoundError('Farmer profile not found or not approved');
  }

  if (!farmer.isapproved) {
    throw new NotFoundError('Farmer profile not approved');
  }

  const farmerId = farmer._id;

  // Get stock statistics
  const [
    totalProducts,
    availableProducts,
    outOfStockProducts,
    lowStockProducts,
    totalStock,
    categoryStats
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact' }).eq('farmerid', farmerId),
    supabase.from('products').select('*', { count: 'exact' }).eq('farmerid', farmerId).eq('isavailable', true),
    supabase.from('products').select('*', { count: 'exact' }).eq('farmerid', farmerId).eq('stockquantity', 0),
    supabase.from('products').select('*', { count: 'exact' }).eq('farmerid', farmerId).lt('stockquantity', 10).gt('stockquantity', 0),
    supabase.from('products').select('stockquantity').eq('farmerid', farmerId),
    supabase.from('products').select('category').eq('farmerid', farmerId)
  ]);

  // Check for errors in any of the queries
  if (totalProducts.error) {
    throw new Error('Failed to fetch total products count');
  }
  if (availableProducts.error) {
    throw new Error('Failed to fetch available products count');
  }
  if (outOfStockProducts.error) {
    throw new Error('Failed to fetch out of stock products count');
  }
  if (lowStockProducts.error) {
    throw new Error('Failed to fetch low stock products count');
  }
  if (totalStock.error) {
    throw new Error('Failed to fetch total stock');
  }
  if (categoryStats.error) {
    throw new Error('Failed to fetch category statistics');
  }

  // Calculate category statistics
  const categoryMap = {};
  categoryStats.data?.forEach(product => {
    if (product.category) {
      categoryMap[product.category] = (categoryMap[product.category] || 0) + 1;
    }
  });

  const statistics = {
    totalProducts: totalProducts.count || 0,
    availableProducts: availableProducts.count || 0,
    outOfStockProducts: outOfStockProducts.count || 0,
    lowStockProducts: lowStockProducts.count || 0,
    totalStock: totalStock.data?.reduce((sum, item) => sum + (item.stockquantity || 0), 0) || 0,
    categoryStats: Object.entries(categoryMap).map(([category, count]) => ({
      category,
      count,
      total_stock: 0 // We can calculate this if needed
    }))
  };

  return responseHelper.success(res, statistics, 'Stock statistics retrieved successfully');
});

// Get farmer analytics
const getFarmerAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { timeRange = '30days' } = req.query;

  console.log('Getting farmer analytics for user:', userId, 'timeRange:', timeRange);
  console.log('User object:', req.user);
  console.log('User role:', req.user?.role);

  try {
    // Get farmer record
    const { data: farmer, error: farmerError } = await supabase
      .from('farmers')
      .select('_id')
      .eq('userid', userId)
      .single();

    if (farmerError || !farmer) {
      console.log('No farmer record found for user:', userId);
      
      // Try to get analytics data directly without farmer record
      try {
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('totalamount, status, createdat, items, userid')
          .gte('createdat', startDate.toISOString())
          .lte('createdat', now.toISOString())
          .order('createdat', { ascending: false });

        if (!ordersError && orders) {
          console.log('Found orders directly:', orders?.length || 0);
          
          // Calculate analytics from orders directly
          let totalRevenue = 0;
          let totalOrders = 0;
          const customerIds = new Set();
          const productSales = {};
          const customerOrders = new Map();

          orders?.forEach(order => {
            totalRevenue += parseFloat(order.totalamount) || 0;
            totalOrders += 1;
            customerIds.add(order.userid);
            
            // Track product sales
            order.items?.forEach(item => {
              if (item.productid) {
                if (!productSales[item.productid]) {
                  productSales[item.productid] = {
                    name: item.productname || 'Unknown Product',
                    sales: 0,
                    revenue: 0
                  };
                }
                productSales[item.productid].sales += parseInt(item.quantity) || 0;
                productSales[item.productid].revenue += (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
              }
            });
            
            // Track customer orders
            if (!customerOrders.has(order.userid)) {
              customerOrders.set(order.userid, 0);
            }
            customerOrders.set(order.userid, customerOrders.get(order.userid) + 1);
          });

          // Calculate customer insights
          let newCustomers = 0;
          let returningCustomers = 0;
          customerOrders.forEach((orderCount, userId) => {
            if (orderCount === 1) {
              newCustomers += 1;
            } else {
              returningCustomers += 1;
            }
          });

          // Get product count
          const { count: productCount, error: productError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('farmerid', userId);

          const analytics = {
            overview: {
              totalRevenue,
              totalOrders,
              totalProducts: productCount || 0,
              activeCustomers: customerIds.size
            },
            salesData: [],
            productPerformance: Object.values(productSales).slice(0, 5),
            recentOrders: orders?.slice(0, 5).map(order => ({
              id: order.ordernumber || order._id,
              customer: 'Customer', // We don't have user names
              amount: order.totalamount,
              status: order.status,
              date: order.createdat
            })) || [],
            customerInsights: {
              newCustomers,
              returningCustomers,
              topLocations: [] // Would need address data
            }
          };

          console.log('Analytics calculated from orders:', analytics);
          return responseHelper.success(res, analytics, 'Analytics retrieved successfully');
        }
      } catch (directError) {
        console.log('Error getting direct analytics:', directError);
      }
      
      return responseHelper.success(res, {
        overview: {
          totalRevenue: 0,
          totalOrders: 0,
          totalProducts: 0,
          activeCustomers: 0
        },
        salesData: [],
        productPerformance: [],
        recentOrders: [],
        customerInsights: {
          newCustomers: 0,
          returningCustomers: 0,
          topLocations: []
        }
      }, 'Analytics retrieved successfully');
    }

    const farmerId = farmer._id;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get orders within date range
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('totalamount, status, createdat, items, userid')
      .eq('farmerid', farmerId)
      .gte('createdat', startDate.toISOString())
      .lte('createdat', now.toISOString())
      .order('createdat', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
    }

    // Calculate overview metrics
    let totalRevenue = 0;
    let totalOrders = 0;
    const customerIds = new Set();
    const productSales = {};

    orders?.forEach(order => {
      totalRevenue += parseFloat(order.totalamount) || 0;
      totalOrders += 1;
      customerIds.add(order.userid);

      // Track product sales
      order.items?.forEach(item => {
        if (item.productid) {
          if (!productSales[item.productid]) {
            productSales[item.productid] = {
              name: item.productname || 'Unknown Product',
              sales: 0,
              revenue: 0
            };
          }
          productSales[item.productid].sales += parseInt(item.quantity) || 0;
          productSales[item.productid].revenue += (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
        }
      });
    });

    // Get product count
    const { count: productCount, error: productError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('farmerid', farmerId);

    if (productError) {
      console.error('Error fetching product count:', productError);
    }

    // Get active customers count (unique customers with orders)
    const { data: uniqueCustomers, error: customersError } = await supabase
      .from('orders')
      .select('userid', { count: 'exact' })
      .eq('farmerid', farmerId)
      .gte('createdat', startDate.toISOString());

    if (customersError) {
      console.error('Error fetching customers:', customersError);
    }

    // Calculate daily sales data
    const salesData = [];
    const dailyMap = new Map();

    orders?.forEach(order => {
      const date = order.createdat.split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { revenue: 0, orders: 0 });
      }
      const day = dailyMap.get(date);
      day.revenue += parseFloat(order.totalamount) || 0;
      day.orders += 1;
    });

    // Convert to array and sort by date
    Array.from(dailyMap.entries())
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .forEach(([date, data]) => {
        salesData.push({
          date,
          revenue: data.revenue,
          orders: data.orders
        });
      });

    // Get product performance (top 5 products)
    const productPerformance = Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // Get recent orders (last 5)
    const recentOrders = orders?.slice(0, 5).map(order => ({
      id: order.ordernumber || order._id,
      customer: 'Customer', // We'll need to join with users table for names
      amount: order.totalamount,
      status: order.status,
      date: order.createdat
    })) || [];

    // Calculate customer insights
    const customerOrders = new Map();
    orders?.forEach(order => {
      if (!customerOrders.has(order.userid)) {
        customerOrders.set(order.userid, 0);
      }
      customerOrders.set(order.userid, customerOrders.get(order.userid) + 1);
    });

    let newCustomers = 0;
    let returningCustomers = 0;

    customerOrders.forEach((orderCount, userId) => {
      if (orderCount === 1) {
        newCustomers += 1;
      } else {
        returningCustomers += 1;
      }
    });

    // Get top locations (from orders)
    const locationMap = new Map();
    orders?.forEach(order => {
      const city = order.deliveryaddresscity || 'Unknown';
      const state = order.deliveryaddressstate || 'Unknown';
      const location = `${city}, ${state}`;
      
      if (!locationMap.has(location)) {
        locationMap.set(location, 0);
      }
      locationMap.set(location, locationMap.get(location) + 1);
    });

    const topLocations = Array.from(locationMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, orders]) => ({ location, orders }));

    const analytics = {
      overview: {
        totalRevenue,
        totalOrders,
        totalProducts: productCount || 0,
        activeCustomers: customerIds.size
      },
      salesData,
      productPerformance,
      recentOrders,
      customerInsights: {
        newCustomers,
        returningCustomers,
        topLocations
      }
    };

    console.log('Farmer analytics calculated:', analytics);

    return responseHelper.success(res, analytics, 'Analytics retrieved successfully');

  } catch (error) {
    console.error('Error getting farmer analytics:', error);
    return responseHelper.error(res, 'Failed to get analytics', 500);
  }
});

module.exports = {
  addProduct,
  updateProduct,
  updateStock,
  toggleAvailability,
  getFarmerProducts,
  getLowStockAlerts,
  getStockStatistics,
  checkTableSchema,
  getFarmerAnalytics
};
