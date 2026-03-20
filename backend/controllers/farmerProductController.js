const supabase = require('../config/supabaseClient');
const logger = require('../config/logger');
const responseHelper = require('../utils/responseHelper');
const { asyncHandler, NotFoundError, ValidationError } = require('../middlewares/enhancedErrorHandler');

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
const addProduct = asyncHandler(async (req, res) => {
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
    expiryDate
  } = req.body;

  console.log('addProduct called with userId:', userId);

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

  // Create product using Supabase with correct farmerid
  const productData = {
    farmerid: farmerRecord._id, // ✅ Use _id from farmers table
    name,
    description,
    category,
    priceperunit: parseFloat(price),
    unit,
    stockquantity: parseInt(stockQuantity),
    minorderquantity: parseInt(minimumOrder) || 1,
    images,
    isavailable: isAvailable,
    harvestdate: harvestDate || null,
    expirydate: expiryDate || null
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
});

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
  const { productId } = req.params;
  const { stockquantity, operation = 'set' } = req.body; // operation: 'set', 'add', 'subtract'

  // Validate input
  if (stockquantity === undefined || stockquantity < 0) {
    throw new ValidationError('Valid stock quantity is required');
  }

  if (!['set', 'add', 'subtract'].includes(operation)) {
    throw new ValidationError('Invalid operation. Must be set, add, or subtract');
  }

  // Get farmer ID
  const farmerQuery = 'SELECT _id FROM farmers WHERE _id = $1 AND isapproved = true';
  const farmerResult = await query(farmerQuery, [userId]);

  if (farmerResult.rows.length === 0) {
    throw new NotFoundError('Farmer profile not found or not approved');
  }

  const farmerId = farmerResult.rows[0]._id;

  // Check if product exists and belongs to farmer
  const productCheckQuery = 'SELECT _id, stockquantity FROM products WHERE _id = $1 AND farmerid = $2';
  const productCheckResult = await query(productCheckQuery, [productId, farmerId]);

  if (productCheckResult.rows.length === 0) {
    throw new NotFoundError('Product not found or access denied');
  }

  const currentProduct = productCheckResult.rows[0];
  let newStockQuantity;

  // Calculate new stock based on operation
  switch (operation) {
    case 'set':
      newStockQuantity = parseInt(stockquantity);
      break;
    case 'add':
      newStockQuantity = currentProduct.stockquantity + parseInt(stockquantity);
      break;
    case 'subtract':
      newStockQuantity = currentProduct.stockquantity - parseInt(stockquantity);
      if (newStockQuantity < 0) {
        throw new ValidationError('Cannot subtract more than current stock');
      }
      break;
  }

  // Update stock with atomic operation
  const updateQuery = `
    UPDATE products 
    SET stockquantity = $1, updatedat = CURRENT_TIMESTAMP
    WHERE _id = $2 AND farmerid = $3
    RETURNING *
  `;

  const updateResult = await query(updateQuery, [newStockQuantity, productId, farmerId]);
  const updatedProduct = updateResult.rows[0];

  logger.info(`Stock updated: productId=${productId}, oldStock=${currentProduct.stockquantity}, newStock=${newStockQuantity}`);

  return responseHelper.success(res, {
    ...updatedProduct,
    images: updatedProduct.images ? JSON.parse(updatedProduct.images) : []
  }, 'Stock updated successfully');
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

  // Get farmer ID
  const farmerQuery = 'SELECT _id FROM farmers WHERE _id = $1 AND isapproved = true';
  const farmerResult = await query(farmerQuery, [userId]);

  if (farmerResult.rows.length === 0) {
    throw new NotFoundError('Farmer profile not found or not approved');
  }

  const farmerId = farmerResult.rows[0]._id;

  // Get products with low stock
  const lowStockQuery = `
    SELECT 
      _id,
      name,
      category,
      stockquantity,
      unit,
      priceperunit,
      isavailable,
      updatedat
    FROM products
    WHERE farmerid = $1 
      AND stockquantity <= $2
      AND isavailable = true
    ORDER BY stockquantity ASC
  `;

  const lowStockResult = await query(lowStockQuery, [farmerId, parseInt(threshold)]);

  return responseHelper.success(res, {
    lowStockProducts: lowStockResult.rows,
    threshold: parseInt(threshold),
    count: lowStockResult.rows.length
  }, 'Low stock alerts retrieved successfully');
});

// Get stock statistics for farmer
const getStockStatistics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get farmer ID
  const farmerQuery = 'SELECT _id FROM farmers WHERE _id = $1 AND isapproved = true';
  const farmerResult = await query(farmerQuery, [userId]);

  if (farmerResult.rows.length === 0) {
    throw new NotFoundError('Farmer profile not found or not approved');
  }

  const farmerId = farmerResult.rows[0]._id;

  // Get stock statistics
  const [
    totalProducts,
    availableProducts,
    outOfStockProducts,
    lowStockProducts,
    totalStock,
    categoryStats
  ] = await Promise.all([
    query('SELECT COUNT(*) as count FROM products WHERE farmerid = $1', [farmerId]),
    query('SELECT COUNT(*) as count FROM products WHERE farmerid = $1 AND isavailable = true', [farmerId]),
    query('SELECT COUNT(*) as count FROM products WHERE farmerid = $1 AND stockquantity = 0', [farmerId]),
    query('SELECT COUNT(*) as count FROM products WHERE farmerid = $1 AND stockquantity <= 10 AND stockquantity > 0', [farmerId]),
    query('SELECT SUM(stockquantity) as total FROM products WHERE farmerid = $1', [farmerId]),
    query(`
      SELECT category, COUNT(*) as count, SUM(stockquantity) as total_stock
      FROM products 
      WHERE farmerid = $1 
      GROUP BY category
      ORDER BY count DESC
    `, [farmerId])
  ]);

  const statistics = {
    totalProducts: parseInt(totalProducts.rows[0].count) || 0,
    availableProducts: parseInt(availableProducts.rows[0].count) || 0,
    outOfStockProducts: parseInt(outOfStockProducts.rows[0].count) || 0,
    lowStockProducts: parseInt(lowStockProducts.rows[0].count) || 0,
    totalStock: parseInt(totalStock.rows[0].total) || 0,
    categoryStats: categoryStats.rows.map(row => ({
      category: row.category,
      count: parseInt(row.count),
      totalStock: parseInt(row.total_stock)
    }))
  };

  return responseHelper.success(res, statistics, 'Stock statistics retrieved successfully');
});

module.exports = {
  addProduct,
  updateProduct,
  updateStock,
  toggleAvailability,
  getFarmerProducts,
  getLowStockAlerts,
  getStockStatistics,
  checkTableSchema
};
