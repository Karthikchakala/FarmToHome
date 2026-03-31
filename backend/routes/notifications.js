const express = require('express');
const router = express.Router();

// Import controllers
const { 
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
} = require('../controllers/notificationController');

// Import middleware
const { authenticate } = require('../middlewares/auth');

// All notification routes require authentication
router.use(authenticate);

// Test endpoint to create a notification
router.post('/test', async (req, res) => {
  try {
    const { createNotification } = require('../controllers/notificationController');
    const supabase = require('../config/supabaseClient');
    
    // Debug: Check what user info we have
    console.log('Current user info:', req.user);
    
    // Find the correct user ID from the users table
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('_id')
      .eq('email', req.user.email)
      .single();
    
    if (userError || !userRecord) {
      return res.status(400).json({ 
        success: false, 
        error: 'User not found in users table',
        details: userError 
      });
    }
    
    const correctUserId = userRecord._id;
    console.log('Using correct user ID from users table:', correctUserId);
    
    const result = await createNotification(
      correctUserId,
      '🧪 Test Notification',
      'This is a test notification to verify the system is working.',
      'system_update',
      'medium',
      { test: true },
      '/dashboard'
    );
    
    if (result) {
      res.json({ 
        success: true, 
        data: result,
        message: 'Test notification created successfully'
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create test notification' 
      });
    }
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Debug endpoint to check user tables
router.get('/debug-user', async (req, res) => {
  try {
    const supabase = require('../config/supabaseClient');
    const userId = req.user._id;
    const userEmail = req.user.email;
    
    // Check users table by ID
    const { data: userById, error: userByIdError } = await supabase
      .from('users')
      .select('*')
      .eq('_id', userId)
      .single();
    
    // Check users table by email (to find the correct user record)
    const { data: userByEmail, error: userByEmailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();
    
    // Check consumers table
    const { data: consumer, error: consumerError } = await supabase
      .from('consumers')
      .select('*')
      .eq('userid', userId)
      .single();
    
    // Check farmers table
    const { data: farmer, error: farmerError } = await supabase
      .from('farmers')
      .select('*')
      .eq('userid', userId)
      .single();
    
    res.json({
      authUserId: userId,
      userEmail,
      userById: { data: userById, error: userByIdError },
      userByEmail: { data: userByEmail, error: userByEmailError },
      consumer: { data: consumer, error: consumerError },
      farmer: { data: farmer, error: farmerError }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user notifications
router.get('/', getUserNotifications);

// Mark notification as read
router.put('/:id/read', markNotificationRead);

// Mark all notifications as read
router.put('/read-all', markAllNotificationsRead);

// Delete notification
router.delete('/:id', deleteNotification);

module.exports = router;
