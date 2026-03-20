const { query, transaction } = require('../db');
const logger = require('../config/logger');
const responseHelper = require('../utils/responseHelper');
const { asyncHandler, NotFoundError, ValidationError } = require('../middlewares/enhancedErrorHandler');
const supabase = require('../config/supabaseClient');

// Add review (only for delivered orders)
const addReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { orderId, farmerId, rating, comment } = req.body;

  // Validate input
  if (!orderId || !farmerId || !rating || rating < 1 || rating > 5) {
    throw new ValidationError('Valid order ID, farmer ID, and rating (1-5) are required');
  }

  // Verify order belongs to user and is delivered
  const orderQuery = `
    SELECT o._id, o.consumerid, o.farmerid, o.status, o.ordernumber,
           p.farmerid as product_farmer_id
    FROM orders o
    LEFT JOIN products p ON (o.items::json -> 0 ->> 'productid')::uuid = p._id
    WHERE o._id = $1 AND o.consumerid = $2
  `;

  const orderResult = await query(orderQuery, [orderId, userId]);

  if (orderResult.rows.length === 0) {
    throw new NotFoundError('Order not found or access denied');
  }

  const order = orderResult.rows[0];

  if (order.status !== 'DELIVERED') {
    throw new ValidationError('Reviews can only be added for delivered orders');
  }

  // Verify farmer ID matches the order
  if (order.farmerid !== farmerId) {
    throw new ValidationError('Farmer ID does not match the order');
  }

  // Check if user has already reviewed this farmer for this order
  const existingReviewQuery = `
    SELECT _id FROM reviews 
    WHERE customerid = $1 AND orderid = $2 AND farmerid = $3
  `;

  const existingReviewResult = await query(existingReviewQuery, [userId, orderId, farmerId]);

  if (existingReviewResult.rows.length > 0) {
    throw new ValidationError('You have already reviewed this farmer for this order');
  }

  // Start transaction
  const client = await transaction();
  try {
    // Insert review
    const reviewQuery = `
      INSERT INTO reviews (
        customerid, orderid, farmerid, rating, comment, createdat, updatedat
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const reviewResult = await client.query(reviewQuery, [
      userId, orderId, farmerId, parseInt(rating), comment || null
    ]);

    const review = reviewResult.rows[0];

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

    const ratingUpdateResult = await client.query(ratingUpdateQuery, [farmerId]);
    const updatedFarmer = ratingUpdateResult.rows[0];

    // Update product rating if applicable
    const productRatingUpdateQuery = `
      UPDATE products 
      SET ratingaverage = (
        SELECT COALESCE(AVG(r.rating), 0) 
        FROM reviews r
        JOIN orders o ON r.orderid = o._id
        WHERE o.items::jsonb ? 'productid' 
        AND (o.items::jsonb -> 'productid')::text = products._id::text
        AND r.farmerid = $1
      ),
      ratingcount = (
        SELECT COUNT(DISTINCT r._id) 
        FROM reviews r
        JOIN orders o ON r.orderid = o._id
        WHERE o.items::jsonb ? 'productid' 
        AND (o.items::jsonb -> 'productid')::text = products._id::text
        AND r.farmerid = $1
      ),
      updatedat = CURRENT_TIMESTAMP
      WHERE farmerid = $1
    `;

    await client.query(productRatingUpdateQuery, [farmerId]);

    await client.query('COMMIT');

    logger.info(`Review added: reviewId=${review._id}, userId=${userId}, farmerId=${farmerId}, rating=${rating}`);

    return responseHelper.created(res, {
      review: {
        ...review,
        farmer: {
          ratingAverage: parseFloat(updatedFarmer.ratingaverage),
          totalReviews: parseInt(updatedFarmer.totalreviews)
        }
      }
    }, 'Review added successfully');

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Review creation error:', error);
    throw error;
  }
});

// Get reviews for a farmer
const getFarmerReviews = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;
  const { page = 1, limit = 20, rating } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Validate farmer exists
  const farmerQuery = 'SELECT _id, farmname FROM farmers WHERE _id = $1';
  const farmerResult = await query(farmerQuery, [farmerId]);

  if (farmerResult.rows.length === 0) {
    throw new NotFoundError('Farmer not found');
  }

  // Build where clause
  let whereClause = 'WHERE r.farmerid = $1';
  const queryParams = [farmerId, parseInt(limit), offset];

  if (rating) {
    whereClause += ' AND r.rating = $4';
    queryParams.push(parseInt(rating));
  }

  // Get reviews with user information
  const reviewsQuery = `
    SELECT 
      r._id,
      r.rating,
      r.comment,
      r.createdat,
      r.orderid,
      o.ordernumber,
      u.name as reviewer_name,
      u.email as reviewer_email
    FROM reviews r
    LEFT JOIN orders o ON r.orderid = o._id
    LEFT JOIN users u ON r.customerid = u._id
    ${whereClause}
    ORDER BY r.createdat DESC
    LIMIT $2 OFFSET $3
  `;

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM reviews r
    ${whereClause.replace('ORDER BY r.createdat DESC', '')}
  `;

  // Get rating distribution
  const distributionQuery = `
    SELECT 
      rating,
      COUNT(*) as count
    FROM reviews
    WHERE farmerid = $1
    GROUP BY rating
    ORDER BY rating
  `;

  const [reviewsResult, countResult, distributionResult] = await Promise.all([
    query(reviewsQuery, queryParams),
    query(countQuery, queryParams.slice(0, -2)),
    query(distributionQuery, [farmerId])
  ]);

  const total = parseInt(countResult.rows[0].total);

  // Calculate rating distribution
  const distribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  };

  distributionResult.rows.forEach(row => {
    distribution[row.rating] = parseInt(row.count);
  });

  // Get farmer rating info
  const farmerRatingQuery = `
    SELECT ratingaverage, totalreviews 
    FROM farmers 
    WHERE _id = $1
  `;

  const farmerRatingResult = await query(farmerRatingQuery, [farmerId]);
  const farmerRating = farmerRatingResult.rows[0];

  return responseHelper.success(res, {
    farmer: {
      id: farmerId,
      farmname: farmerResult.rows[0].farmname,
      ratingAverage: parseFloat(farmerRating.ratingaverage) || 0,
      totalReviews: parseInt(farmerRating.totalreviews) || 0
    },
    reviews: reviewsResult.rows,
    distribution,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  }, 'Farmer reviews retrieved successfully');
});

// Get user's reviews
const getUserReviews = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, rating } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Build Supabase query
  let supabaseQuery = supabase
    .from('reviews')
    .select(`
      *,
      orders(ordernumber, status),
      farmers(farmname, location)
    `, { count: 'exact' })
    .eq('customerid', userId)
    .order('createdat', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  // Apply rating filter if provided
  if (rating) {
    supabaseQuery = supabaseQuery.eq('rating', parseInt(rating));
  }

  const { data: reviews, error, count } = await supabaseQuery;

  // Handle case where reviews table doesn't exist
  if (error && error.code === 'PGRST205') {
    // Reviews table doesn't exist, return empty response
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
    });
  }

  if (error) {
    logger.error('Get user reviews error:', error);
    throw new Error('Failed to fetch reviews');
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

module.exports = {
  addReview,
  getFarmerReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  getReviewEligibility
};
