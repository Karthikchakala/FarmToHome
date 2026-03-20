const { body, param, query, validationResult } = require('express-validator');
const logger = require('../config/logger');
const responseHelper = require('../utils/responseHelper');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    logger.warn(`Validation failed: ${JSON.stringify(errorMessages)}`);

    return responseHelper.badRequest(res, 'Validation failed', errorMessages);
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian phone number starting with 6-9'),
  
  body('role')
    .isIn(['consumer', 'farmer'])
    .withMessage('Role must be either consumer or farmer'),
  
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Product creation validation
const validateProductCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('category')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  
  body('priceperunit')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),
  
  body('unit')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Unit must be between 1 and 20 characters'),
  
  body('stockquantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  
  handleValidationErrors
];

// Product update validation
const validateProductUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  
  body('priceperunit')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),
  
  body('unit')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Unit must be between 1 and 20 characters'),
  
  body('stockquantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  
  handleValidationErrors
];

// Product search validation
const validateProductSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .isIn(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'created_desc', 'created_asc', 'rating_desc'])
    .withMessage('Invalid sort option'),
  
  handleValidationErrors
];

// Order placement validation
const validateOrderPlacement = [
  body('deliveryAddress')
    .notEmpty()
    .withMessage('Delivery address is required'),
  
  body('deliveryAddress.home')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('House/Flat number must be between 1 and 50 characters'),
  
  body('deliveryAddress.street')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Street address must be between 3 and 100 characters'),
  
  body('deliveryAddress.city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  
  body('deliveryAddress.state')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),
  
  body('deliveryAddress.pincode')
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Please provide a valid 6-digit Indian pincode'),
  
  body('paymentMethod')
    .optional()
    .isIn(['COD', 'ONLINE'])
    .withMessage('Payment method must be either COD or ONLINE'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  
  handleValidationErrors
];

// Customer profile update validation
const validateCustomerProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian phone number starting with 6-9'),
  
  body('defaultaddress.home')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('House/Flat number must be between 1 and 50 characters'),
  
  body('defaultaddress.street')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Street address must be between 3 and 100 characters'),
  
  body('defaultaddress.city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  
  body('defaultaddress.state')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),
  
  body('defaultaddress.pincode')
    .optional()
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Please provide a valid 6-digit Indian pincode'),
  
  handleValidationErrors
];

// Farmer profile update validation
const validateFarmerProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian phone number starting with 6-9'),
  
  body('farmname')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Farm name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('deliveryradius')
    .optional()
    .isFloat({ min: 1, max: 20 })
    .withMessage('Delivery radius must be between 1 and 20 km'),
  
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  
  handleValidationErrors
];

// Message validation
const validateMessage = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateProductCreation,
  validateProductUpdate,
  validateProductSearch,
  validateOrderPlacement,
  validateCustomerProfileUpdate,
  validateFarmerProfileUpdate,
  validateId,
  validateMessage,
  handleValidationErrors
};
