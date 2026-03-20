const jwt = require('jsonwebtoken');
const { query } = require('../db');

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
      
      // Get user with role information
      let userResult;
      if (decoded.role === 'admin') {
        userResult = await query(
          'SELECT _id, email, role FROM users WHERE _id = $1 AND role = $2',
          [decoded._id, 'admin']
        );
      } else if (decoded.role === 'farmer') {
        userResult = await query(`
          SELECT u._id, u.email, u.role, f._id as farmer_id, f.isapproved, f.farmname
          FROM users u 
          LEFT JOIN farmers f ON u._id = f.userid 
          WHERE u._id = $1 AND u.role = $2
        `, [decoded._id, 'farmer']);
      } else {
        userResult = await query(`
          SELECT u._id, u.email, u.role, c._id as consumer_id
          FROM users u 
          LEFT JOIN consumers c ON u._id = c.userid 
          WHERE u._id = $1 AND u.role = $2
        `, [decoded._id, 'consumer']);
      }

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token or user not found'
        });
      }

      const user = userResult.rows[0];

      // Check if user role is allowed
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Insufficient permissions.'
        });
      }

      // Additional check for farmer approval
      if (user.role === 'farmer' && !user.isapproved) {
        return res.status(403).json({
          success: false,
          error: 'Farmer account not approved yet.'
        });
      }

      // Attach user to request object
      req.user = {
        _id: user._id,
        email: user.email,
        role: user.role,
        farmerId: user.farmer_id,
        consumerId: user.consumer_id,
        farmName: user.farmname,
        isApproved: user.isapproved
      };

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
