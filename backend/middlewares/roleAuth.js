const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

// Role-based authentication middleware
const roleAuth = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Get token from header
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Access token required'
        });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user role is in allowed roles
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Insufficient permissions.'
        });
      }

      // Set user in request
      req.user = decoded;
      next();
    } catch (error) {
      console.error('Role auth error:', error);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired'
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

// Specific role checkers
const isAdmin = roleAuth(['admin']);
const isFarmer = roleAuth(['farmer']);
const isConsumer = roleAuth(['consumer']);
const isFarmerOrAdmin = roleAuth(['farmer', 'admin']);
const isConsumerOrFarmer = roleAuth(['consumer', 'farmer']);

module.exports = {
  roleAuth,
  isAdmin,
  isFarmer,
  isConsumer,
  isFarmerOrAdmin,
  isConsumerOrFarmer
};
