const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const supabase = require('../config/supabaseClient');

// JWT secret key (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// Verify JWT token
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const decoded = verifyToken(token);
    console.log('DEBUG: Decoded JWT token:', decoded);
    
    // Get user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('_id, name, email, role')
      .eq('_id', decoded.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // User not found, create user from token data
      logger.info('User not found in database, creating from token:', decoded.id);
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          {
            _id: decoded.id,
            name: decoded.name || 'Unknown',
            email: decoded.email,
            role: decoded.role || 'consumer',
            phone: decoded.phone || '',
            isverified: true
          }
        ])
        .select('_id, name, email, role')
        .single();

      if (createError) {
        logger.error('Failed to create user:', createError);
        return res.status(401).json({
          success: false,
          error: 'User not found and could not be created.',
          details: createError.message
        });
      }

      req.user = newUser;
      next();
      return;
    }

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token. User not found.',
        details: error?.message
      });
    }

    // Note: isBanned check removed as column doesn't exist in Supabase
    // if (user.isBanned) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Access denied. Account is banned.'
    //   });
    // }

    req.user = user;
    console.log('DEBUG: Authenticated user:', { id: user._id, email: user.email, role: user.role });
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token.'
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('DEBUG: Authorize check - User role:', req.user?.role, 'Required roles:', roles);
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      console.log('DEBUG: Authorization failed - User role not in required roles');
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.'
      });
    }

    console.log('DEBUG: Authorization successful');
    next();
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = verifyToken(token);
      const result = await query(
        'SELECT _id, name, email, role, isBanned FROM users WHERE _id = $1',
        [decoded.userId]
      );

      if (result.rows.length > 0 && !result.rows[0].isbanned) {
        req.user = result.rows[0];
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  authorize,
  optionalAuth
};
