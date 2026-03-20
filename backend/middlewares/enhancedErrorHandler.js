const logger = require('../config/logger');
const responseHelper = require('../utils/responseHelper');

// Enhanced error handling middleware
const enhancedErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(err, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user?._id
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field} already exists: ${value}`;
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // PostgreSQL errors
  if (err.code === '23505') { // Unique violation
    const message = 'Duplicate entry violation';
    error = { message, statusCode: 400 };
  }

  if (err.code === '23503') { // Foreign key violation
    const message = 'Referenced resource not found';
    error = { message, statusCode: 400 };
  }

  if (err.code === '23502') { // Not null violation
    const message = 'Required field is missing';
    error = { message, statusCode: 400 };
  }

  // Validation errors
  if (err.name === 'ValidationError' && err.errors) {
    const errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message
    }));
    return responseHelper.validationError(res, errors);
  }

  // Rate limiting errors
  if (err.status === 429) {
    return responseHelper.tooManyRequests(res, err.message);
  }

  // Default error response
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || 'Internal server error';

  // Don't expose stack trace in production
  if (process.env.NODE_ENV === 'production') {
    return responseHelper.error(res, message, null, statusCode);
  }

  // Include stack trace in development
  return responseHelper.error(res, message, {
    stack: err.stack,
    name: err.name,
    code: err.code
  }, statusCode);
};

// 404 handler
const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
    this.name = 'ValidationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500);
    this.name = 'DatabaseError';
  }
}

module.exports = {
  enhancedErrorHandler,
  notFound,
  asyncHandler,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  DatabaseError
};
