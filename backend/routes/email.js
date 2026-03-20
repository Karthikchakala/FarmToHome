const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const { sendTestEmail } = require('../services/emailService');

// Test email endpoint (for development/testing)
router.post('/test', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { to } = req.body;
    
    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      });
    }

    const result = await sendTestEmail(to);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test email'
    });
  }
});

module.exports = router;
