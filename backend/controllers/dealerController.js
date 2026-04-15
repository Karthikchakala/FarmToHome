const { query, transaction } = require('../db');
const logger = require('../config/logger');
const supabase = require('../config/supabaseClient');
const responseHelper = require('../utils/responseHelper');
const { asyncHandler, NotFoundError, ValidationError } = require('../middlewares/enhancedErrorHandler');

// Register dealer
const registerDealer = asyncHandler(async (req, res) => {
  const { 
    businessName, 
    businessType, 
    licenseNumber, 
    businessAddress, 
    businessCity, 
    businessState, 
    businessPostalCode, 
    businessPhone, 
    businessEmail, 
    description,
    minimumOrderQuantity,
    serviceDeliveryRadius,
    preferredCrops,
    paymentTerms
  } = req.body;

  const userId = req.user._id;

  // Check if dealer profile already exists
  const { data: existingDealer, error: checkError } = await supabase
    .from('dealers')
    .select('_id')
    .eq('userid', userId)
    .single();

  if (existingDealer) {
    throw new ValidationError('Dealer profile already exists for this user');
  }

  // Create dealer profile
  const { data: dealer, error: dealerError } = await supabase
    .from('dealers')
    .insert([{
      userid: userId,
      businessname: businessName,
      businesstype: businessType,
      licensenumber: licenseNumber,
      businessaddress: businessAddress,
      businesscity: businessCity,
      businessstate: businessState,
      businesspostalcode: businessPostalCode,
      businessphone: businessPhone,
      businessemail: businessEmail,
      description: description || null,
      minimumorderquantity: minimumOrderQuantity || 1,
      servicedeliveryradius: serviceDeliveryRadius || 50,
      preferredcrops: preferredCrops || [],
      paymentterms: paymentTerms || 'COD'
    }])
    .select()
    .single();

  if (dealerError) {
    logger.error('Error creating dealer profile:', dealerError);
    throw new Error('Failed to create dealer profile');
  }

  return responseHelper.created(res, dealer, 'Dealer profile created successfully');
});

// Get dealer profile
const getDealerProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const { data: dealer, error } = await supabase
    .from('dealers')
    .select('_id, businessname, businesstype, licensenumber, businessphone, businessemail, businessaddress, businesscity, businessstate, businesspostalcode, minimumorderquantity, servicedeliveryradius, preferredcrops, paymentterms, description, isverified, ratingaverage, totalreviews, totaltransactions, createdat, updatedat')
    .eq('userid', userId)
    .single();

  if (error || !dealer) {
    throw new NotFoundError('Dealer profile not found');
  }

  return responseHelper.success(res, dealer, 'Dealer profile retrieved successfully');
});

// Update dealer profile
const updateDealerProfile = asyncHandler(async (req, res) => {
  logger.info('updateDealerProfile called');
  const userId = req.user._id;
  const updateData = req.body;

  // Remove fields that shouldn't be updated directly
  delete updateData.userid;
  delete updateData._id;
  delete updateData.createdat;
  delete updateData.ratingaverage;
  delete updateData.totalreviews;
  delete updateData.totaltransactions;

  logger.info('Updating dealer profile for user:', userId);
  logger.info('Update data:', updateData);

  const { error } = await supabase
    .from('dealers')
    .update(updateData)
    .eq('userid', userId);

  if (error) {
    logger.error('Dealer profile update error:', error);
    throw new NotFoundError('Dealer profile not found or update failed');
  }

  // Fetch the updated dealer profile
  const { data: dealer, error: fetchError } = await supabase
    .from('dealers')
    .select('_id, businessname, businesstype, licensenumber, businessphone, businessemail, businessaddress, businesscity, businessstate, businesspostalcode, minimumorderquantity, servicedeliveryradius, preferredcrops, paymentterms, description, createdat, updatedat')
    .eq('userid', userId)
    .single();

  if (fetchError || !dealer) {
    logger.error('Error fetching updated dealer profile:', fetchError);
    return responseHelper.success(res, { success: true }, 'Dealer profile updated successfully');
  }

  logger.info('Dealer profile updated successfully');
  return responseHelper.success(res, dealer, 'Dealer profile updated successfully');
});

// Get available farmers for bulk purchase
const getAvailableFarmers = asyncHandler(async (req, res) => {
  const { 
    cropType, 
    location, 
    radius = 50, 
    page = 1, 
    limit = 10 
  } = req.query;

  const userId = req.user._id;
  logger.info('Fetching available farmers for dealer:', userId);

  // Get dealer's location and preferences
  const { data: dealer, error: dealerError } = await supabase
    .from('dealers')
    .select('businesscity, businessstate, preferredcrops, servicedeliveryradius')
    .eq('userid', userId)
    .single();

  if (dealerError) {
    logger.error('Dealer profile query error:', dealerError);
    throw new NotFoundError('Dealer profile not found');
  }

  if (!dealer) {
    logger.error('No dealer profile found for user:', userId);
    throw new NotFoundError('Dealer profile not found');
  }

  logger.info('Dealer profile found:', dealer);

  // Build query for verified farmers
  let query = supabase
    .from('farmers')
    .select(`
      *,
      users!inner(name, email, phone, profileimageurl)
    `)
    .eq('verificationstatus', 'approved');

  const { data: farmers, error: farmersError } = await query;

  if (farmersError) {
    logger.error('Error fetching farmers:', farmersError);
    throw new Error('Failed to fetch available farmers');
  }

  logger.info('Found farmers:', farmers?.length || 0);

  // If no farmers, return empty array
  if (!farmers || farmers.length === 0) {
    return responseHelper.success(res, [], 'No farmers found');
  }

  // Fetch products for each farmer
  const farmersWithProducts = await Promise.all(
    farmers.map(async (farmer) => {
      try {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('_id, name, category, priceperunit, stockquantity, isavailable, images')
          .eq('farmerid', farmer._id)
          .eq('isavailable', true)
          .gt('stockquantity', 0);

        if (productsError) {
          logger.error('Error fetching products for farmer:', farmer._id, productsError);
          return {
            ...farmer,
            products: []
          };
        }

        // Filter by crop type if specified
        let filteredProducts = products || [];
        if (cropType) {
          filteredProducts = filteredProducts.filter(p => p.category === cropType);
        }

        // Filter by preferred crops if specified
        if (dealer.preferredcrops && dealer.preferredcrops.length > 0) {
          filteredProducts = filteredProducts.filter(p => 
            dealer.preferredcrops.includes(p.category)
          );
        }

        return {
          ...farmer,
          products: filteredProducts
        };
      } catch (error) {
        logger.error('Error processing farmer:', farmer._id, error);
        return {
          ...farmer,
          products: []
        };
      }
    })
  );

  // Filter out farmers with no matching products
  const result = farmersWithProducts.filter(farmer => farmer.products && farmer.products.length > 0);

  logger.info('Returning farmers with products:', result.length);

  return responseHelper.success(res, result, 'Available farmers retrieved successfully');
});

// Create bulk order
const createBulkOrder = asyncHandler(async (req, res) => {
  const {
    farmerId,
    items,
    pickupAddress,
    pickupCity,
    pickupState,
    pickupPostalCode,
    pickupDate,
    pickupTime,
    notes,
    paymentMethod = 'COD'
  } = req.body;

  const userId = req.user._id;

  // Get dealer profile
  const { data: dealer, error: dealerError } = await supabase
    .from('dealers')
    .select('_id, businessname')
    .eq('userid', userId)
    .single();

  if (dealerError || !dealer) {
    throw new NotFoundError('Dealer profile not found');
  }

  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  // Generate order number
  const orderNumber = `BULK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Create bulk order
  const { data: bulkOrder, error: orderError } = await supabase
    .from('bulk_orders')
    .insert([{
      dealerid: dealer._id,
      farmerid: farmerId,
      ordernumber: orderNumber,
      totalamount: totalAmount,
      pickupaddress: pickupAddress,
      pickupcity: pickupCity,
      pickupstate: pickupState,
      pickuppostalcode: pickupPostalCode,
      pickupdate: pickupDate,
      pickuptime: pickupTime,
      notes: notes || null,
      paymentmethod: paymentMethod
    }])
    .select()
    .single();

  if (orderError) {
    logger.error('Error creating bulk order:', orderError);
    throw new Error('Failed to create bulk order');
  }

  // Create bulk order items
  const orderItems = items.map(item => ({
    bulkorderid: bulkOrder._id,
    productid: item.productId,
    productname: item.productName,
    quantity: item.quantity,
    unit: item.unit,
    unitprice: item.unitPrice,
    totalprice: item.quantity * item.unitPrice
  }));

  const { data: createdItems, error: itemsError } = await supabase
    .from('bulk_order_items')
    .insert(orderItems)
    .select();

  if (itemsError) {
    logger.error('Error creating bulk order items:', itemsError);
    throw new Error('Failed to create bulk order items');
  }

  return responseHelper.created(res, {
    ...bulkOrder,
    items: createdItems
  }, 'Bulk order created successfully');
});

// Get dealer's bulk orders
const getDealerBulkOrders = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { status, page = 1, limit = 10 } = req.query;

  // Get dealer profile
  const { data: dealer, error: dealerError } = await supabase
    .from('dealers')
    .select('_id')
    .eq('userid', userId)
    .single();

  if (dealerError || !dealer) {
    throw new NotFoundError('Dealer profile not found');
  }

  let query = supabase
    .from('bulk_orders')
    .select(`
      *,
      farmers!inner(
        users!inner(name, email, phone)
      ),
      bulk_order_items!inner(
        productid,
        productname,
        quantity,
        unit,
        unitprice,
        totalprice
      )
    `)
    .eq('dealerid', dealer._id);

  if (status) {
    query = query.eq('status', status);
  }

  query = query.order('createdat', { ascending: false });

  const { data: orders, error } = await query;

  if (error) {
    logger.error('Error fetching bulk orders:', error);
    throw new Error('Failed to fetch bulk orders');
  }

  return responseHelper.success(res, orders, 'Bulk orders retrieved successfully');
});

// Update bulk order status
const updateBulkOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  const userId = req.user._id;

  // Get dealer profile
  const { data: dealer, error: dealerError } = await supabase
    .from('dealers')
    .select('_id')
    .eq('userid', userId)
    .single();

  if (dealerError || !dealer) {
    throw new NotFoundError('Dealer profile not found');
  }

  const { data: order, error } = await supabase
    .from('bulk_orders')
    .update({ status })
    .eq('_id', orderId)
    .eq('dealerid', dealer._id)
    .select()
    .single();

  if (error || !order) {
    throw new NotFoundError('Bulk order not found or update failed');
  }

  return responseHelper.success(res, order, 'Bulk order status updated successfully');
});

// Get comprehensive dealer analytics
const getDealerAnalytics = asyncHandler(async (req, res) => {
  const { period = 'monthly' } = req.query;
  const userId = req.user._id;

  // Get dealer profile
  const { data: dealer, error: dealerError } = await supabase
    .from('dealers')
    .select('_id')
    .eq('userid', userId)
    .single();

  if (dealerError || !dealer) {
    throw new NotFoundError('Dealer profile not found');
  }

  // Calculate date ranges based on period
  const now = new Date();
  let startDate, endDate;
  let groupBy;

  switch (period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      groupBy = 'day';
      break;
    case 'weekly':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      endDate = new Date(now);
      groupBy = 'day';
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear() + 1, 0, 1);
      groupBy = 'month';
      break;
    case 'monthly':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      groupBy = 'day';
      break;
  }

  // Fetch all bulk orders for the dealer
  const { data: allOrders, error: ordersError } = await supabase
    .from('bulk_orders')
    .select(`
      *,
      bulk_order_items!inner(
        productid,
        productname,
        quantity,
        unit,
        unitprice,
        totalprice
      )
    `)
    .eq('dealerid', dealer._id)
    .gte('createdat', startDate.toISOString())
    .lte('createdat', endDate.toISOString())
    .order('createdat', { ascending: true });

  if (ordersError) {
    logger.error('Error fetching orders for analytics:', ordersError);
    throw new Error('Failed to fetch analytics data');
  }

  // Calculate statistics
  const totalOrders = allOrders?.length || 0;
  const completedOrders = allOrders?.filter(o => o.status === 'completed')?.length || 0;
  const pendingOrders = allOrders?.filter(o => o.status === 'pending')?.length || 0;
  const cancelledOrders = allOrders?.filter(o => o.status === 'cancelled')?.length || 0;

  // Calculate revenue
  const totalRevenue = allOrders?.reduce((sum, order) => {
    if (order.status === 'completed') {
      return sum + (order.totalamount || 0);
    }
    return sum;
  }, 0) || 0;

  // Calculate pending revenue
  const pendingRevenue = allOrders?.reduce((sum, order) => {
    if (order.status === 'pending' || order.status === 'confirmed' || order.status === 'picked_up') {
      return sum + (order.totalamount || 0);
    }
    return sum;
  }, 0) || 0;

  // Group data by time period
  const revenueByPeriod = {};
  const ordersByPeriod = {};

  allOrders?.forEach(order => {
    const date = new Date(order.createdat);
    let key;

    if (groupBy === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (groupBy === 'month') {
      key = date.toISOString().slice(0, 7);
    } else {
      key = date.toISOString().slice(0, 7);
    }

    if (!revenueByPeriod[key]) {
      revenueByPeriod[key] = 0;
      ordersByPeriod[key] = 0;
    }

    if (order.status === 'completed') {
      revenueByPeriod[key] += order.totalamount || 0;
    }
    ordersByPeriod[key]++;
  });

  // Convert to array format
  const revenueData = Object.entries(revenueByPeriod).map(([period, revenue]) => ({
    period,
    revenue
  })).sort((a, b) => a.period.localeCompare(b.period));

  const orderData = Object.entries(ordersByPeriod).map(([period, count]) => ({
    period,
    count
  })).sort((a, b) => a.period.localeCompare(b.period));

  // Calculate top products
  const productStats = {};
  allOrders?.forEach(order => {
    order.bulk_order_items?.forEach(item => {
      if (!productStats[item.productname]) {
        productStats[item.productname] = {
          name: item.productname,
          totalQuantity: 0,
          totalSpent: 0,
          orderCount: 0
        };
      }
      productStats[item.productname].totalQuantity += item.quantity;
      productStats[item.productname].totalSpent += item.totalprice;
      productStats[item.productname].orderCount++;
    });
  });

  const topProducts = Object.values(productStats)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  // Calculate average order value
  const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

  // Calculate outgoing (pending orders amount)
  const outgoing = allOrders?.reduce((sum, order) => {
    if (order.status === 'pending' || order.status === 'confirmed') {
      return sum + (order.totalamount || 0);
    }
    return sum;
  }, 0) || 0;

  // Get total farmers dealt with
  const uniqueFarmers = new Set(allOrders?.map(o => o.farmerid));
  const totalFarmers = uniqueFarmers.size;

  const analytics = {
    period,
    dateRange: {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    },
    overview: {
      totalOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      totalRevenue,
      pendingRevenue,
      outgoing,
      avgOrderValue,
      totalFarmers
    },
    revenueData,
    orderData,
    topProducts,
    ordersByStatus: {
      pending: pendingOrders,
      confirmed: allOrders?.filter(o => o.status === 'confirmed')?.length || 0,
      picked_up: allOrders?.filter(o => o.status === 'picked_up')?.length || 0,
      completed: completedOrders,
      cancelled: cancelledOrders
    }
  };

  return responseHelper.success(res, analytics, 'Dealer analytics retrieved successfully');
});

// Get dealer messages
const getDealerMessages = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get dealer profile
  const { data: dealer, error: dealerError } = await supabase
    .from('dealers')
    .select('_id')
    .eq('userid', userId)
    .single();

  if (dealerError || !dealer) {
    throw new NotFoundError('Dealer profile not found');
  }

  // Fetch messages for the dealer with user joins
  const { data: messages, error: messagesError } = await supabase
    .from('consultation_messages')
    .select(`
      *,
      sender:users!senderid(name, email, profileimageurl),
      receiver:users!receiverid(name, email, profileimageurl)
    `)
    .or(`senderid.eq.${dealer._id},receiverid.eq.${dealer._id}`)
    .order('createdat', { ascending: false });

  if (messagesError) {
    logger.error('Error fetching messages:', messagesError);
    throw new Error('Failed to fetch messages');
  }

  return responseHelper.success(res, messages || [], 'Messages retrieved successfully');
});

module.exports = {
  registerDealer,
  getDealerProfile,
  updateDealerProfile,
  getAvailableFarmers,
  createBulkOrder,
  getDealerBulkOrders,
  updateBulkOrderStatus,
  getDealerAnalytics,
  getDealerMessages
};
