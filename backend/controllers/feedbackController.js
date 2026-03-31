const asyncHandler = require('express-async-handler');
const { supabase } = require('../config/supabase');
const responseHelper = require('../utils/responseHelper');
const logger = require('../config/logger');

// Create customer feedback
const createCustomerFeedback = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { orderId, rating, comment, category, feedbackType } = req.body;

  console.log('Creating customer feedback for user:', userId);

  try {
    // Validate required fields
    if (!orderId || !rating || !comment) {
      return responseHelper.error(res, 'Order ID, rating, and comment are required', 400);
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return responseHelper.error(res, 'Rating must be between 1 and 5', 400);
    }

    // Check if order exists and belongs to the customer
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, products!inner(farmerid)')
      .eq('_id', orderId)
      .eq('userid', userId)
      .single();

    if (orderError || !order) {
      return responseHelper.error(res, 'Order not found or does not belong to you', 404);
    }

    // Check if feedback already exists for this order
    const { data: existingFeedback, error: existingError } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('orderid', orderId)
      .eq('userid', userId)
      .single();

    if (existingFeedback) {
      return responseHelper.error(res, 'Feedback already exists for this order', 400);
    }

    // Create feedback record
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedbacks')
      .insert({
        userid: userId,
        orderid: orderId,
        farmerid: order.products.farmerid,
        rating: rating,
        comment: comment,
        category: category || 'general',
        feedbacktype: 'customer',
        status: 'pending',
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Error creating feedback:', feedbackError);
      return responseHelper.error(res, 'Failed to create feedback', 500);
    }

    // Update product rating (optional - if you want to update average ratings)
    await updateProductRating(order.products.farmerid, order.products._id);

    return responseHelper.success(res, feedback, 'Feedback submitted successfully');

  } catch (error) {
    console.error('Error in createCustomerFeedback:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
});

// Create farmer feedback
const createFarmerFeedback = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { orderId, rating, comment, category, feedbackType } = req.body;

  console.log('Creating farmer feedback for user:', userId);

  try {
    // Validate required fields
    if (!orderId || !rating || !comment) {
      return responseHelper.error(res, 'Order ID, rating, and comment are required', 400);
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return responseHelper.error(res, 'Rating must be between 1 and 5', 400);
    }

    // Get farmer record
    const { data: farmer, error: farmerError } = await supabase
      .from('farmers')
      .select('_id')
      .eq('userid', userId)
      .single();

    if (farmerError || !farmer) {
      return responseHelper.error(res, 'Farmer record not found', 404);
    }

    // Check if order exists and involves this farmer
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, products!inner(farmerid)')
      .eq('_id', orderId)
      .eq('products.farmerid', farmer._id)
      .single();

    if (orderError || !order) {
      return responseHelper.error(res, 'Order not found or does not involve your farm', 404);
    }

    // Check if feedback already exists for this order
    const { data: existingFeedback, error: existingError } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('orderid', orderId)
      .eq('userid', userId)
      .single();

    if (existingFeedback) {
      return responseHelper.error(res, 'Feedback already exists for this order', 400);
    }

    // Create feedback record
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedbacks')
      .insert({
        userid: userId,
        orderid: orderId,
        farmerid: farmer._id,
        rating: rating,
        comment: comment,
        category: category || 'general',
        feedbacktype: 'farmer',
        status: 'pending',
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Error creating feedback:', feedbackError);
      return responseHelper.error(res, 'Failed to create feedback', 500);
    }

    return responseHelper.success(res, feedback, 'Feedback submitted successfully');

  } catch (error) {
    console.error('Error in createFarmerFeedback:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
});

// Get all feedbacks (admin only)
const getAllFeedbacks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, feedbackType, category } = req.query;

  console.log('Getting all feedbacks for admin');

  try {
    let query = supabase
      .from('feedbacks')
      .select(`
        *,
        users!inner(name, email),
        orders!inner(ordernumber, totalamount, createdat),
        farmers!inner(farmname)
      `, { count: 'exact' })
      .order('createdat', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (feedbackType) {
      query = query.eq('feedbacktype', feedbackType);
    }
    if (category) {
      query = query.eq('category', category);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: feedbacks, error, count } = await query;

    if (error) {
      console.error('Error fetching feedbacks:', error);
      return responseHelper.error(res, 'Failed to fetch feedbacks', 500);
    }

    const response = {
      feedbacks: feedbacks || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    };

    return responseHelper.success(res, response, 'Feedbacks retrieved successfully');

  } catch (error) {
    console.error('Error in getAllFeedbacks:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
});

// Get feedback by ID (admin only)
const getFeedbackById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const { data: feedback, error } = await supabase
      .from('feedbacks')
      .select(`
        *,
        users!inner(name, email, phone),
        orders!inner(ordernumber, totalamount, createdat, items),
        farmers!inner(farmname, email, phone)
      `)
      .eq('_id', id)
      .single();

    if (error || !feedback) {
      return responseHelper.error(res, 'Feedback not found', 404);
    }

    return responseHelper.success(res, feedback, 'Feedback retrieved successfully');

  } catch (error) {
    console.error('Error in getFeedbackById:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
});

// Update feedback status (admin only)
const updateFeedbackStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Validate status
    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return responseHelper.error(res, 'Invalid status', 400);
    }

    const { data: feedback, error } = await supabase
      .from('feedbacks')
      .update({
        status: status,
        updatedat: new Date().toISOString()
      })
      .eq('_id', id)
      .select()
      .single();

    if (error || !feedback) {
      return responseHelper.error(res, 'Feedback not found', 404);
    }

    return responseHelper.success(res, feedback, 'Feedback status updated successfully');

  } catch (error) {
    console.error('Error in updateFeedbackStatus:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
});

// Delete feedback (admin only)
const deleteFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('feedbacks')
      .delete()
      .eq('_id', id);

    if (error) {
      return responseHelper.error(res, 'Feedback not found', 404);
    }

    return responseHelper.success(res, null, 'Feedback deleted successfully');

  } catch (error) {
    console.error('Error in deleteFeedback:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
});

// Helper function to update product rating
const updateProductRating = async (farmerId, productId) => {
  try {
    // Calculate new average rating
    const { data: feedbacks, error: feedbackError } = await supabase
      .from('feedbacks')
      .select('rating')
      .eq('farmerid', farmerId);

    if (feedbackError) return;

    if (feedbacks && feedbacks.length > 0) {
      const avgRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
      
      await supabase
        .from('products')
        .update({
          ratingaverage: avgRating,
          ratingcount: feedbacks.length,
          updatedat: new Date().toISOString()
        })
        .eq('_id', productId);
    }
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
};

module.exports = {
  createCustomerFeedback,
  createFarmerFeedback,
  getAllFeedbacks,
  getFeedbackById,
  updateFeedbackStatus,
  deleteFeedback
};
