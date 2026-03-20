// Standard API response helper
const responseHelper = {
  // Success response
  success: (res, data = null, message = 'Operation successful', statusCode = 200) => {
    const response = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(response);
  },

  // Created response
  created: (res, data = null, message = 'Resource created successfully') => {
    return responseHelper.success(res, data, message, 201);
  },

  // No content response
  noContent: (res, message = 'Operation successful') => {
    const response = {
      success: true,
      message,
      timestamp: new Date().toISOString()
    };

    return res.status(204).json(response);
  },

  // Error response
  error: (res, message = 'Operation failed', errors = null, statusCode = 500) => {
    const response = {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    };

    // Don't expose internal errors in production
    if (statusCode === 500 && process.env.NODE_ENV === 'production') {
      response.message = 'Internal server error';
      response.errors = null;
    }

    return res.status(statusCode).json(response);
  },

  // Bad request response
  badRequest: (res, message = 'Invalid request', errors = null) => {
    return responseHelper.error(res, message, errors, 400);
  },

  // Unauthorized response
  unauthorized: (res, message = 'Authentication required') => {
    return responseHelper.error(res, message, null, 401);
  },

  // Forbidden response
  forbidden: (res, message = 'Access denied') => {
    return responseHelper.error(res, message, null, 403);
  },

  // Not found response
  notFound: (res, message = 'Resource not found') => {
    return responseHelper.error(res, message, null, 404);
  },

  // Conflict response
  conflict: (res, message = 'Resource conflict', errors = null) => {
    return responseHelper.error(res, message, errors, 409);
  },

  // Too many requests response
  tooManyRequests: (res, message = 'Too many requests') => {
    return responseHelper.error(res, message, null, 429);
  },

  // Pagination response helper
  paginated: (res, data, pagination, message = 'Data retrieved successfully') => {
    const response = {
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total: pagination.total || 0,
        pages: pagination.pages || 0,
        hasNext: pagination.hasNext || false,
        hasPrev: pagination.hasPrev || false
      },
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(response);
  },

  // Validation error response
  validationError: (res, errors) => {
    const message = 'Validation failed';
    const errorDetails = Array.isArray(errors) ? errors : [errors];
    
    return responseHelper.badRequest(res, message, errorDetails);
  },

  // Server error response
  serverError: (res, error = null) => {
    const logger = require('../config/logger');
    
    // Log the error for debugging
    if (error) {
      logger.error('Server error:', error);
    }

    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error?.message || 'Internal server error';

    return responseHelper.error(res, message, null, 500);
  },

  // Custom response with metadata
  custom: (res, options = {}) => {
    const {
      success = true,
      message = 'Operation completed',
      data = null,
      errors = null,
      statusCode = 200,
      metadata = {}
    } = options;

    const response = {
      success,
      message,
      data,
      errors,
      ...metadata,
      timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(response);
  }
};

module.exports = responseHelper;
