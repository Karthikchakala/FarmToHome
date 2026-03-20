const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

// Create a rate limiter for general API requests
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    data: null
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      data: null
    });
  }
});

// Create a stricter rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      data: null
    });
  }
});

// Create a rate limiter for order placement
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 orders per hour
  message: {
    success: false,
    message: 'Too many orders placed, please try again later.',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Order rate limit exceeded for IP: ${req.ip}, User: ${req.user?._id}`);
    res.status(429).json({
      success: false,
      message: 'Too many orders placed, please try again later.',
      data: null
    });
  }
});

// Create a rate limiter for message sending
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 messages per minute
  message: {
    success: false,
    message: 'Too many messages sent, please try again later.',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Message rate limit exceeded for IP: ${req.ip}, User: ${req.user?._id}`);
    res.status(429).json({
      success: false,
      message: 'Too many messages sent, please try again later.',
      data: null
    });
  }
});

// Create a rate limiter for product searches
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 searches per minute
  message: {
    success: false,
    message: 'Too many search requests, please try again later.',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Search rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many search requests, please try again later.',
      data: null
    });
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  orderLimiter,
  messageLimiter,
  searchLimiter
};
