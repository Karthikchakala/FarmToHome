const { query, transaction } = require('../db');
const logger = require('../config/logger');
const responseHelper = require('../utils/responseHelper');
const { asyncHandler, NotFoundError, ValidationError } = require('../middlewares/enhancedErrorHandler');
const supabase = require('../config/supabaseClient');
const { notifyReviewReceived } = require('./notificationController');

// Add review (only for delivered orders)
const addReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { orderId, farmerId, rating, comment } = req.body;

  // Validate input
  if (!orderId || !farmerId || !rating || rating < 1 || rating > 5) {
    throw new ValidationError('Valid order ID, farmer ID, and rating (1-5) are required');
  }

  // First, get the consumer record for this user
  const { data: consumer, error: consumerError } = await supabase
    .from('consumers')
    .select('_id')
    .eq('userid', userId)
    .single();

  if (consumerError || !consumer) {
    throw new NotFoundError('Consumer record not found');
  }

  const consumerId = consumer._id;

  // Verify order belongs to user and is delivered using Supabase
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('_id', orderId)
    .eq('consumerid', consumerId)
    .single();

  if (orderError || !order) {
    throw new NotFoundError('Order not found or access denied');
  }

  if (order.status !== 'DELIVERED') {
    throw new ValidationError('Reviews can only be added for delivered orders');
  }

  // Verify farmer ID matches the order
  if (order.farmerid !== farmerId) {
    throw new ValidationError('Farmer ID does not match the order');
  }

  // Check if user has already reviewed this farmer for this order
  const { data: existingReview, error: existingError } = await supabase
    .from('reviews')
    .select('*')
    .eq('customerid', consumerId)
    .eq('orderid', orderId)
    .eq('farmerid', farmerId)
    .single();

  if (!existingError && existingReview) {
    throw new ValidationError('You have already reviewed this farmer for this order');
  }

  try {
    // Insert review using Supabase (without updatedat since it's not in the schema)
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        customerid: consumerId,
        orderid: orderId,
        farmerid: farmerId,
        rating: parseInt(rating),
        comment: comment || null
      })
      .select()
      .single();

    if (reviewError || !review) {
      throw new Error('Failed to create review: ' + (reviewError?.message || 'Unknown error'));
    }

    // Update farmer rating using Supabase
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('farmerid', farmerId);

    const avgRating = reviews && reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    await supabase
      .from('farmers')
      .update({
        ratingaverage: avgRating,
        totalreviews: reviews?.length || 0,
        updatedat: new Date().toISOString()
      })
      .eq('_id', farmerId);

    // Send notification to farmer (non-blocking)
    try {
      // Get customer name for notification
      const { data: customerData } = await supabase
        .from('users')
        .select('name')
        .eq('_id', userId)
        .single();

      const customerName = customerData?.name || 'Customer';
      
      // Get product name from order
      const productName = order.items?.[0]?.name || 'Product';
      
      // Notify farmer about new review
      await notifyReviewReceived(
        farmerId,
        productName,
        parseInt(rating),
        customerName
      );
    } catch (notificationError) {
      logger.error('Error sending review notification:', notificationError);
    }

    logger.info(`Review added: reviewId=${review._id}, userId=${userId}, farmerId=${farmerId}, rating=${rating}`);

    return responseHelper.created(res, {
      review: {
        ...review,
        farmer: {
          ratingAverage: avgRating,
          totalReviews: reviews?.length || 0
        }
      }
    }, 'Review added successfully');

  } catch (error) {
    logger.error('Review creation error:', error);
    throw error;
  }
});

// Get reviews for a farmer
const getFarmerReviews = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;
  const { page = 1, limit = 20, rating } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Validate farmer exists using Supabase
  const { data: farmer, error: farmerError } = await supabase
    .from('farmers')
    .select('_id, farmname')
    .eq('_id', farmerId)
    .single();

  if (farmerError || !farmer) {
    throw new NotFoundError('Farmer not found');
  }

  try {
    // Build query - join with consumers to get user info, then users for name
    let query = supabase
      .from('reviews')
      .select(`
        _id,
        rating,
        comment,
        createdat,
        orderid,
        orders!left (
          ordernumber
        ),
        consumers!left (
          userid
        )
      `, { count: 'exact' })
      .eq('farmerid', farmerId)
      .order('createdat', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    // Apply rating filter if provided
    if (rating) {
      query = query.eq('rating', parseInt(rating));
    }

    const { data: reviews, error: reviewsError, count } = await query;

    if (reviewsError) {
      throw new Error('Failed to fetch reviews: ' + reviewsError.message);
    }

    // Get user names for all reviewers
    const userIds = reviews?.map(r => r.consumers?.userid).filter(Boolean) || [];
    const { data: users } = await supabase
      .from('users')
      .select('_id, name, email')
      .in('_id', userIds);

    // Create a map for quick lookup
    const userMap = {};
    users?.forEach(user => {
      userMap[user._id] = user;
    });

    // Format the response
    const formattedReviews = reviews.map(review => ({
      _id: review._id,
      rating: review.rating,
      comment: review.comment,
      createdat: review.createdat,
      orderid: review.orderid,
      ordernumber: review.orders?.ordernumber,
      reviewer_name: userMap[review.consumers?.userid]?.name,
      reviewer_email: userMap[review.consumers?.userid]?.email
    }));

    // Get rating distribution
    const { data: ratingStats, error: statsError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('farmerid', farmerId);

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (!statsError && ratingStats) {
      ratingStats.forEach(r => {
        ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
      });
    }

    return responseHelper.success(res, {
      reviews: formattedReviews,
      farmer: {
        _id: farmer._id,
        farmname: farmer.farmname
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / parseInt(limit)),
        hasNext: offset + parseInt(limit) < (count || 0),
        hasPrev: parseInt(page) > 1
      },
      ratingDistribution,
      averageRating: ratingStats.length > 0 
        ? ratingStats.reduce((sum, r) => sum + r.rating, 0) / ratingStats.length 
        : 0
    }, 'Reviews retrieved successfully');

  } catch (error) {
    logger.error('Get farmer reviews error:', error);
    throw error;
  }
});

// Get user's reviews
const getUserReviews = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, rating } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // First, get the consumer record for this user
  const { data: consumer, error: consumerError } = await supabase
    .from('consumers')
    .select('_id')
    .eq('userid', userId)
    .single();

  if (consumerError || !consumer) {
    // Return empty if no consumer record found
    return responseHelper.success(res, {
      reviews: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0,
        hasNext: false,
        hasPrev: false
      }
    }, 'User reviews retrieved successfully');
  }

  const consumerId = consumer._id;

  // Build Supabase query
  let supabaseQuery = supabase
    .from('reviews')
    .select(`
      *,
      orders(ordernumber, status),
      farmers(farmname)
    `, { count: 'exact' })
    .eq('customerid', consumerId)
    .order('createdat', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  // Apply rating filter if provided
  if (rating) {
    supabaseQuery = supabaseQuery.eq('rating', parseInt(rating));
  }

  const { data: reviews, error, count } = await supabaseQuery;

  if (error) {
    throw new Error('Failed to fetch user reviews: ' + error.message);
  }

  // Format the response
  const formattedReviews = reviews.map(review => ({
    _id: review._id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdat,
    orderId: review.orderid,
    farmerId: review.farmerid,
    orderNumber: review.orders?.ordernumber || 'Unknown',
    orderStatus: review.orders?.status || 'Unknown',
    farmName: review.farmers?.farmname || 'Unknown Farm',
    farmerLocation: review.farmers?.location || 'Unknown'
  }));

  return responseHelper.success(res, {
    reviews: formattedReviews,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count || 0,
      pages: Math.ceil((count || 0) / parseInt(limit)),
      hasNext: offset + parseInt(limit) < (count || 0),
      hasPrev: parseInt(page) > 1
    }
  });
});

// Get review eligibility
const getReviewEligibility = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get delivered orders that haven't been reviewed yet
  const eligibilityQuery = `
    SELECT 
      o._id,
      o.ordernumber,
      o.deliveredat,
      o.farmerid,
      f.farmname,
      f.location,
      CASE WHEN r._id IS NOT NULL THEN true ELSE false END as already_reviewed
    FROM orders o
    LEFT JOIN farmers f ON o.farmerid = f._id
    LEFT JOIN reviews r ON o._id = r.orderid AND r.customerid = $1
    WHERE o.consumerid = $1 
      AND o.status = 'DELIVERED'
    ORDER BY o.deliveredat DESC
  `;

  const eligibilityResult = await query(eligibilityQuery, [userId]);

  const eligibleOrders = eligibilityResult.rows.filter(order => !order.already_reviewed);

  return responseHelper.success(res, {
    eligibleOrders,
    totalEligible: eligibleOrders.length
  }, 'Review eligibility retrieved successfully');
});

// Update review
const updateReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  // Validate input
  if (!rating || rating < 1 || rating > 5) {
    throw new ValidationError('Valid rating (1-5) is required');
  }

  // Check if review exists and belongs to user
  const reviewCheckQuery = `
    SELECT r._id, r.customerid, r.farmerid, r.rating as old_rating
    FROM reviews r
    WHERE r._id = $1
  `;

  const reviewCheckResult = await query(reviewCheckQuery, [reviewId]);

  if (reviewCheckResult.rows.length === 0) {
    throw new NotFoundError('Review not found');
  }

  const review = reviewCheckResult.rows[0];

  if (review.customerid !== userId) {
    throw new ValidationError('You can only update your own reviews');
  }

  // Start transaction
  const client = await transaction();
  try {
    // Update review
    const updateQuery = `
      UPDATE reviews 
      SET rating = $1, comment = $2, updatedat = CURRENT_TIMESTAMP
      WHERE _id = $3 AND customerid = $4
      RETURNING *
    `;

    const updateResult = await client.query(updateQuery, [rating, comment || null, reviewId, userId]);
    const updatedReview = updateResult.rows[0];

    // Update farmer rating
    const ratingUpdateQuery = `
      UPDATE farmers 
      SET ratingaverage = (
        SELECT COALESCE(AVG(rating), 0) 
        FROM reviews 
        WHERE farmerid = $1
      ),
      totalreviews = (
        SELECT COUNT(*) 
        FROM reviews 
        WHERE farmerid = $1
      ),
      updatedat = CURRENT_TIMESTAMP
      WHERE _id = $1
      RETURNING ratingaverage, totalreviews
    `;

    const ratingUpdateResult = await client.query(ratingUpdateQuery, [review.farmerid]);
    const updatedFarmer = ratingUpdateResult.rows[0];

    await client.query('COMMIT');

    logger.info(`Review updated: reviewId=${reviewId}, userId=${userId}, newRating=${rating}`);

    return responseHelper.success(res, {
      review: {
        ...updatedReview,
        farmer: {
          ratingAverage: parseFloat(updatedFarmer.ratingaverage),
          totalReviews: parseInt(updatedFarmer.totalreviews)
        }
      }
    }, 'Review updated successfully');

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Review update error:', error);
    throw error;
  }
});

// Delete review
const deleteReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { reviewId } = req.params;

  // Check if review exists and belongs to user
  const reviewCheckQuery = `
    SELECT r._id, r.customerid, r.farmerid
    FROM reviews r
    WHERE r._id = $1
  `;

  const reviewCheckResult = await query(reviewCheckQuery, [reviewId]);

  if (reviewCheckResult.rows.length === 0) {
    throw new NotFoundError('Review not found');
  }

  const review = reviewCheckResult.rows[0];

  if (review.customerid !== userId) {
    throw new ValidationError('You can only delete your own reviews');
  }

  // Start transaction
  const client = await transaction();
  try {
    // Delete review
    const deleteQuery = `
      DELETE FROM reviews 
      WHERE _id = $1 AND customerid = $2
      RETURNING *
    `;

    await client.query(deleteQuery, [reviewId, userId]);

    // Update farmer rating
    const ratingUpdateQuery = `
      UPDATE farmers 
      SET ratingaverage = (
        SELECT COALESCE(AVG(rating), 0) 
        FROM reviews 
        WHERE farmerid = $1
      ),
      totalreviews = (
        SELECT COUNT(*) 
        FROM reviews 
        WHERE farmerid = $1
      ),
      updatedat = CURRENT_TIMESTAMP
      WHERE _id = $1
      RETURNING ratingaverage, totalreviews
    `;

    const ratingUpdateResult = await client.query(ratingUpdateQuery, [review.farmerid]);
    const updatedFarmer = ratingUpdateResult.rows[0];

    await client.query('COMMIT');

    logger.info(`Review deleted: reviewId=${reviewId}, userId=${userId}`);

    return responseHelper.success(res, {
      farmer: {
        ratingAverage: parseFloat(updatedFarmer.ratingaverage) || 0,
        totalReviews: parseInt(updatedFarmer.totalreviews) || 0
      }
    }, 'Review deleted successfully');

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Review deletion error:', error);
    throw error;
  }
});

// Get reviews for a specific product (Public endpoint)
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 10, rating, sortBy = 'newest' } = req.query;

  // Validate productId
  if (!productId) {
    throw new ValidationError('Product ID is required');
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  try {
    // First, get all orders that contain this product in their items array
    // Using a more compatible JSONB query approach
    const { data: ordersWithProduct, error: ordersError } = await supabase
      .from('orders')
      .select('_id, items')
      .eq('status', 'DELIVERED'); // Only reviews for delivered orders

    if (ordersError) {
      logger.error('Error fetching orders:', ordersError);
      throw new Error('Failed to fetch orders');
    }

    // Filter orders that contain the product in their items array
    const filteredOrders = ordersWithProduct.filter(order => {
      if (!order.items || !Array.isArray(order.items)) return false;
      return order.items.some(item => item.productid === productId);
    });

    if (filteredOrders.length === 0) {
      // No orders found with this product, return empty result
      responseHelper.success(res, {
        reviews: [],
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      }, 'Product reviews retrieved successfully');
      return;
    }

    // Get reviews for those orders
    const orderIds = filteredOrders.map(order => order._id);
    
    let query = supabase
      .from('reviews')
      .select(`
        *,
        consumers!inner(
          _id,
          userid,
          users!inner(
            name
          )
        )
      `, { count: 'exact' })
      .in('orderid', orderIds);

    // Add rating filter if specified
    if (rating && rating !== 'all') {
      query = query.eq('rating', parseInt(rating));
    }

    // Add sorting
    switch (sortBy) {
      case 'oldest':
        query = query.order('createdat', { ascending: true });
        break;
      case 'highest':
        query = query.order('rating', { ascending: false });
        break;
      case 'lowest':
        query = query.order('rating', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('createdat', { ascending: false });
        break;
    }

    // Apply pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data: reviews, error, count } = await query;

    if (error) {
      logger.error('Error fetching product reviews:', error);
      throw new Error('Failed to fetch product reviews');
    }

    // Format the response
    const formattedReviews = reviews.map(review => ({
      _id: review._id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdat,
      updatedAt: review.updatedat,
      customer: {
        _id: review.consumers._id,
        name: review.consumers.users.name || 'Anonymous Customer'
      },
      productId: productId, // Use the requested productId
      orderId: review.orderid
    }));

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limitNum);

    responseHelper.success(res, {
      reviews: formattedReviews,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total: count || 0,
        totalPages: totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    }, 'Product reviews retrieved successfully');

  } catch (error) {
    logger.error('Product reviews fetch error:', error);
    throw error;
  }
});

module.exports = {
  addReview,
  getFarmerReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  getReviewEligibility,
  getProductReviews
};
