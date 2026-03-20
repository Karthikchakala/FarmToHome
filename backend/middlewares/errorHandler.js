const logger = require('../config/logger');

// Centralized error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(err.message, {
    error: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error
  let error = { ...err };
  error.message = err.message;

  // PostgreSQL error handling
  if (err.code === '23505') {
    const message = 'Duplicate entry. This record already exists.';
    error = { message, statusCode: 409 };
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    const message = 'Invalid reference. Related record not found.';
    error = { message, statusCode: 400 };
  }

  // PostgreSQL syntax error
  if (err.code === '42601') {
    const message = 'Database query syntax error.';
    error = { message, statusCode: 500 };
  }

  // JWT error handling
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again.';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your session has expired. Please log in again.';
    error = { message, statusCode: 401 };
  }

  // Validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // Cast error (Mongoose/BSON)
  if (err.name === 'CastError') {
    const message = 'Resource not found.';
    error = { message, statusCode: 404 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
