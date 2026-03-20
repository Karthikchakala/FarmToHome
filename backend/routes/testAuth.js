const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { authenticate } = require('../middlewares/auth');

// Test endpoint to check authentication
router.get('/test-auth', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication successful',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint without authentication
router.get('/no-auth', (req, res) => {
  res.json({
    success: true,
    message: 'No authentication required',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to generate a test token (for debugging)
router.get('/generate-token', (req, res) => {
  const testUser = {
    userId: 'test-user-id',
    role: 'consumer'
  };
  
  const token = jwt.sign(testUser, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
  
  res.json({
    success: true,
    message: 'Test token generated',
    token,
    user: testUser,
    jwtSecret: process.env.JWT_SECRET ? 'loaded' : 'using fallback'
  });
});

// Test endpoint to verify a token
router.post('/verify-token', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Token is required'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    res.json({
      success: true,
      message: 'Token is valid',
      decoded,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      details: error.message,
      jwtSecret: process.env.JWT_SECRET ? 'loaded' : 'using fallback'
    });
  }
});

// Test endpoint to check if user exists in Supabase
router.post('/check-user-supabase', async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required'
    });
  }

  try {
    const supabase = require('../config/supabaseClient');
    const { data: user, error } = await supabase
      .from('users')
      .select('_id, name, email, role, isBanned')
      .eq('_id', userId)
      .single();

    if (error || !user) {
      return res.json({
        success: false,
        message: 'User not found in Supabase',
        userId: userId,
        error: error?.message
      });
    }

    res.json({
      success: true,
      message: 'User found in Supabase',
      user: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Supabase query failed',
      details: error.message
    });
  }
});

// Test endpoint to list all users in Supabase
router.get('/list-users-supabase', async (req, res) => {
  try {
    const supabase = require('../config/supabaseClient');
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .limit(10);

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Supabase query failed',
        details: error.message
      });
    }

    res.json({
      success: true,
      users: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Supabase query failed',
      details: error.message
    });
  }
});

// Test endpoint to check orders table structure
router.get('/check-orders-table', async (req, res) => {
  try {
    const supabase = require('../config/supabaseClient');
    
    // Try to get orders table structure
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .limit(1);

    if (error) {
      return res.json({
        success: false,
        error: 'Orders table query failed',
        details: error.message,
        code: error.code
      });
    }

    res.json({
      success: true,
      message: 'Orders table exists',
      sampleData: orders,
      columns: orders.length > 0 ? Object.keys(orders[0]) : []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Orders table check failed',
      details: error.message
    });
  }
});

// Test endpoint to check order_items table structure
router.get('/check-order-items-table', async (req, res) => {
  try {
    const supabase = require('../config/supabaseClient');
    
    // Try to get order_items table structure
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select('*')
      .limit(1);

    if (error) {
      return res.json({
        success: false,
        error: 'Order_items table query failed',
        details: error.message,
        code: error.code
      });
    }

    res.json({
      success: true,
      message: 'Order_items table exists',
      sampleData: orderItems,
      columns: orderItems.length > 0 ? Object.keys(orderItems[0]) : []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Order_items table check failed',
      details: error.message
    });
  }
});

// Test endpoint to check cart table structure
router.get('/check-cart-table', async (req, res) => {
  try {
    const supabase = require('../config/supabaseClient');
    
    // Try to get cart table structure
    const { data: cartItems, error } = await supabase
      .from('cart')
      .select('*')
      .limit(1);

    if (error) {
      return res.json({
        success: false,
        error: 'Cart table query failed',
        details: error.message,
        code: error.code
      });
    }

    res.json({
      success: true,
      message: 'Cart table exists',
      sampleData: cartItems,
      columns: cartItems.length > 0 ? Object.keys(cartItems[0]) : []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Cart table check failed',
      details: error.message
    });
  }
});

// Test endpoint to check subscriptions table structure
router.get('/check-subscriptions-table', async (req, res) => {
  try {
    const supabase = require('../config/supabaseClient');
    
    // Try to get subscriptions table structure
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);

    if (error) {
      return res.json({
        success: false,
        error: 'Subscriptions table query failed',
        details: error.message,
        code: error.code
      });
    }

    res.json({
      success: true,
      message: 'Subscriptions table exists',
      sampleData: subscriptions,
      columns: subscriptions.length > 0 ? Object.keys(subscriptions[0]) : []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Subscriptions table check failed',
      details: error.message
    });
  }
});

// Test endpoint to check farmers table structure
router.get('/check-farmers-table', async (req, res) => {
  try {
    const supabase = require('../config/supabaseClient');
    
    // Try to get farmers table structure
    const { data: farmers, error } = await supabase
      .from('farmers')
      .select('*')
      .limit(1);

    if (error) {
      return res.json({
        success: false,
        error: 'Farmers table query failed',
        details: error.message,
        code: error.code
      });
    }

    res.json({
      success: true,
      message: 'Farmers table exists',
      sampleData: farmers,
      columns: farmers.length > 0 ? Object.keys(farmers[0]) : []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Farmers table check failed',
      details: error.message
    });
  }
});

// Test endpoint to check consumers table structure
router.get('/check-consumers-table', async (req, res) => {
  try {
    const supabase = require('../config/supabaseClient');
    
    // Try to get consumers table structure
    const { data: consumers, error } = await supabase
      .from('consumers')
      .select('*')
      .limit(1);

    if (error) {
      return res.json({
        success: false,
        error: 'Consumers table query failed',
        details: error.message,
        code: error.code
      });
    }

    res.json({
      success: true,
      message: 'Consumers table exists',
      sampleData: consumers,
      columns: consumers.length > 0 ? Object.keys(consumers[0]) : []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Consumers table check failed',
      details: error.message
    });
  }
});

module.exports = router;
