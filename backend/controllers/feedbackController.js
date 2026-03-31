const asyncHandler = require('express-async-handler');
const { supabase } = require('../config/supabase');
const responseHelper = require('../utils/responseHelper');
const logger = require('../config/logger');

// Create general feedback/complaint
const createFeedback = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    category,
    subcategory,
    subject,
    description,
    priority,
    orderId,
    productId,
    farmerId
  } = req.body;

  console.log('Creating general feedback for user:', userId);

  try {
    // Validate required fields
    if (!category || !subcategory || !subject || !description || !priority) {
      return responseHelper.error(res, 'Missing required fields: category, subcategory, subject, description, priority', 400);
    }

    // Create feedback record
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .insert({
        userid: userId,
        category: category,
        subcategory: subcategory,
        subject: subject,
        description: description,
        priority: priority,
        orderid: orderId || null,
        productid: productId || null,
        farmerid: farmerId || null,
        status: 'pending',
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Error creating feedback:', feedbackError);
      return responseHelper.error(res, 'Failed to submit feedback', 500);
    }

    return responseHelper.success(res, feedback, 'Feedback submitted successfully');

  } catch (error) {
    console.error('Error in createFeedback:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
});

// Get user's feedback
const getUserFeedback = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { category, status, priority, page = 1, limit = 10 } = req.query;

  console.log('Getting feedback for user:', userId);

  try {
    let query = supabase
      .from('feedback')
      .select('*', { count: 'exact' })
      .eq('userid', userId)
      .order('createdat', { ascending: false });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: feedbacks, error, count } = await query;

    if (error) {
      console.error('Error fetching user feedback:', error);
      return responseHelper.error(res, 'Failed to fetch feedback', 500);
    }

    const response = {
      feedbacks: feedbacks || [],
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil((count || 0) / limit),
        total: count || 0,
        limit: parseInt(limit)
      }
    };

    return responseHelper.success(res, response, 'Feedback retrieved successfully');

  } catch (error) {
    console.error('Error in getUserFeedback:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
});

// Get all feedback (admin)
const getAllFeedback = asyncHandler(async (req, res) => {
  const { category, status, priority, page = 1, limit = 10 } = req.query;

  console.log('Getting all feedback for admin');

  try {
    let query = supabase
      .from('feedback')
      .select(`
        *,
        users!inner(name, email)
      `, { count: 'exact' })
      .order('createdat', { ascending: false });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: feedbacks, error, count } = await query;

    if (error) {
      console.error('Error fetching all feedback:', error);
      return responseHelper.error(res, 'Failed to fetch feedback', 500);
    }

    const response = {
      feedbacks: feedbacks || [],
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil((count || 0) / limit),
        total: count || 0,
        limit: parseInt(limit)
      }
    };

    return responseHelper.success(res, response, 'Feedback retrieved successfully');

  } catch (error) {
    console.error('Error in getAllFeedback:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
});

// Add note to feedback
const addFeedbackNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { note, isAdmin = false } = req.body;

  try {
    if (!note || !note.trim()) {
      return responseHelper.error(res, 'Note content is required', 400);
    }

    // Insert note
    const { data: feedbackNote, error } = await supabase
      .from('feedback_notes')
      .insert({
        feedbackid: id,
        note: note.trim(),
        isadmin: isAdmin,
        createdat: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding feedback note:', error);
      return responseHelper.error(res, 'Failed to add note', 500);
    }

    return responseHelper.success(res, feedbackNote, 'Note added successfully');

  } catch (error) {
    console.error('Error in addFeedbackNote:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
});

// Get customer's orders (for feedback context)
const getCustomerOrders = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('_id, ordernumber, createdat, totalamount, status')
      .eq('userid', userId)
      .order('createdat', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error getting customer orders:', error);
      return responseHelper.error(res, 'Failed to fetch orders', 500);
    }

    return responseHelper.success(res, orders, 'Orders retrieved successfully');

  } catch (error) {
    console.error('Error in getCustomerOrders:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
});

// Get customer's products (for feedback context)
const getCustomerProducts = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        _id, 
        name, 
        farmers!inner(farmname)
      `)
      .in('farmerid', `
        SELECT DISTINCT products.farmerid
        FROM products
        INNER JOIN orderitems ON products._id = orderitems.productid
        INNER JOIN orders ON orderitems.orderid = orders._id
        WHERE orders.userid = '${userId}'
      `);

    if (error) {
      console.error('Error getting customer products:', error);
      return responseHelper.error(res, 'Failed to fetch products', 500);
    }

    return responseHelper.success(res, products, 'Products retrieved successfully');

  } catch (error) {
    console.error('Error in getCustomerProducts:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
});

// Get customer's farmers (for feedback context)
const getCustomerFarmers = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const { data: farmers, error } = await supabase
      .from('farmers')
      .select('userid, farmname')
      .in('userid', `
        SELECT DISTINCT products.farmerid
        FROM products
        INNER JOIN orderitems ON products._id = orderitems.productid
        INNER JOIN orders ON orderitems.orderid = orders._id
        WHERE orders.userid = '${userId}'
      `)
      .order('farmname');

    if (error) {
      console.error('Error getting customer farmers:', error);
      return responseHelper.error(res, 'Failed to fetch farmers', 500);
    }

    return responseHelper.success(res, farmers, 'Farmers retrieved successfully');

  } catch (error) {
    console.error('Error in getCustomerFarmers:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
});

// Get feedback statistics (admin)
const getFeedbackStatistics = asyncHandler(async (req, res) => {
  try {
    // Get total counts by status
    const { data: statusStats, error: statusError } = await supabase
      .from('feedback')
      .select('status')
      .then(result => {
        const stats = {};
        result.data.forEach(item => {
          stats[item.status] = (stats[item.status] || 0) + 1;
        });
        return Object.entries(stats).map(([status, count]) => ({ status, count }));
      });

    // Get counts by category
    const { data: categoryStats, error: categoryError } = await supabase
      .from('feedback')
      .select('category')
      .then(result => {
        const stats = {};
        result.data.forEach(item => {
          stats[item.category] = (stats[item.category] || 0) + 1;
        });
        return Object.entries(stats).map(([category, count]) => ({ category, count }));
      });

    // Get counts by priority
    const { data: priorityStats, error: priorityError } = await supabase
      .from('feedback')
      .select('priority')
      .then(result => {
        const stats = {};
        result.data.forEach(item => {
          stats[item.priority] = (stats[item.priority] || 0) + 1;
        });
        return Object.entries(stats).map(([priority, count]) => ({ priority, count }));
      });

    // Get recent feedback count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: recentFeedback, error: recentError } = await supabase
      .from('feedback')
      .select('_id')
      .gte('createdat', thirtyDaysAgo.toISOString());

    const recentCount = recentFeedback ? recentFeedback.length : 0;

    const statistics = {
      statusStats: statusStats || [],
      categoryStats: categoryStats || [],
      priorityStats: priorityStats || [],
      recentCount: recentCount
    };

    return responseHelper.success(res, statistics, 'Statistics retrieved successfully');

  } catch (error) {
    console.error('Error in getFeedbackStatistics:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
});

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
  // New feedback system functions
  createFeedback,
  getUserFeedback,
  getAllFeedback,
  addFeedbackNote,
  getCustomerOrders,
  getCustomerProducts,
  getCustomerFarmers,
  getFeedbackStatistics,
  
  // Existing order-based feedback functions
  createCustomerFeedback,
  createFarmerFeedback,
  getAllFeedbacks,
  getFeedbackById,
  updateFeedbackStatus,
  deleteFeedback
};
