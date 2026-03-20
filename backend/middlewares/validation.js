const validator = require('../utils/validators');
const responseHelper = require('../utils/responseHelper');

// Validation middleware factory
const validate = (validationFn) => {
  return (req, res, next) => {
    try {
      const result = validationFn(req.body);
      
      if (!result.isValid) {
        return responseHelper.validationError(res, result.errors);
      }
      
      // Sanitize request body
      req.body = Object.keys(req.body).reduce((sanitized, key) => {
        if (typeof req.body[key] === 'string') {
          sanitized[key] = validator.sanitize(req.body[key]);
        } else {
          sanitized[key] = req.body[key];
        }
        return sanitized;
      }, {});
      
      next();
    } catch (error) {
      return responseHelper.serverError(res, error);
    }
  };
};

// Query parameter validation middleware
const validateQuery = (validationFn) => {
  return (req, res, next) => {
    try {
      const result = validationFn(req.query);
      
      if (!result.isValid) {
        return responseHelper.validationError(res, result.errors);
      }
      
      // Update query with validated values
      req.query = { ...req.query, ...result };
      
      next();
    } catch (error) {
      return responseHelper.serverError(res, error);
    }
  };
};

// Specific validation middlewares
const validateUserRegistration = validate(validator.validateUserRegistration);
const validateProduct = validate(validator.validateProduct);
const validateOrder = validate(validator.validateOrder);
const validateMessage = validate(validator.validateMessage);
const validateSearchQuery = validateQuery(validator.validateSearchQuery);
const validatePagination = validateQuery(validator.validatePagination);

// Custom validation for specific fields
const validateRequiredFields = (fields) => {
  return validate((body) => validator.validateRequired(fields, body));
};

const validateEmail = (field = 'email') => {
  return validate((body) => {
    const errors = {};
    
    if (!body[field] || !validator.isEmail(body[field])) {
      errors[field] = `Valid ${field} is required`;
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  });
};

const validatePassword = (field = 'password') => {
  return validate((body) => {
    const errors = {};
    
    if (!body[field] || !validator.isStrongPassword(body[field])) {
      errors[field] = 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  });
};

const validateUUID = (field = 'id') => {
  return (req, res, next) => {
    const { [field]: id } = req.params;
    
    if (!id || !validator.isUUID(id)) {
      return responseHelper.badRequest(res, `Valid ${field} is required`);
    }
    
    next();
  };
};

// Validate file upload (basic)
const validateFile = (options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    required = false
  } = options;
  
  return (req, res, next) => {
    try {
      const file = req.file;
      
      if (!file) {
        if (required) {
          return responseHelper.badRequest(res, 'File is required');
        }
        return next();
      }
      
      // Check file size
      if (file.size > maxSize) {
        return responseHelper.badRequest(res, `File size exceeds limit of ${maxSize / 1024 / 1024}MB`);
      }
      
      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return responseHelper.badRequest(res, `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
      }
      
      next();
    } catch (error) {
      return responseHelper.serverError(res, error);
    }
  };
};

// Validate product filters
const validateProductFilters = (req, res, next) => {
  try {
    const { category, minPrice, maxPrice, inStock, sortBy, sortOrder } = req.query;
    const errors = {};
    
    // Validate price range
    if (minPrice && (!validator.isPrice(minPrice) || parseFloat(minPrice) < 0)) {
      errors.minPrice = 'Valid minimum price is required';
    }
    
    if (maxPrice && (!validator.isPrice(maxPrice) || parseFloat(maxPrice) < 0)) {
      errors.maxPrice = 'Valid maximum price is required';
    }
    
    // Validate price range logic
    if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
      errors.priceRange = 'Minimum price cannot be greater than maximum price';
    }
    
    // Validate inStock filter
    if (inStock && !['true', 'false'].includes(inStock.toLowerCase())) {
      errors.inStock = 'inStock must be true or false';
    }
    
    // Validate sort options
    const validSortBy = ['name', 'price', 'createdat', 'stockquantity'];
    const validSortOrder = ['asc', 'desc'];
    
    if (sortBy && !validSortBy.includes(sortBy.toLowerCase())) {
      errors.sortBy = `Invalid sort field. Valid options: ${validSortBy.join(', ')}`;
    }
    
    if (sortOrder && !validSortOrder.includes(sortOrder.toLowerCase())) {
      errors.sortOrder = `Invalid sort order. Valid options: ${validSortOrder.join(', ')}`;
    }
    
    if (Object.keys(errors).length > 0) {
      return responseHelper.validationError(res, errors);
    }
    
    // Sanitize and normalize query parameters
    req.query = {
      ...req.query,
      category: category ? validator.sanitize(category) : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      inStock: inStock ? inStock.toLowerCase() === 'true' : undefined,
      sortBy: sortBy ? sortBy.toLowerCase() : undefined,
      sortOrder: sortOrder ? sortOrder.toLowerCase() : undefined
    };
    
    next();
  } catch (error) {
    return responseHelper.serverError(res, error);
  }
};

module.exports = {
  validate,
  validateQuery,
  validateUserRegistration,
  validateProduct,
  validateOrder,
  validateMessage,
  validateSearchQuery,
  validatePagination,
  validateRequiredFields,
  validateEmail,
  validatePassword,
  validateUUID,
  validateFile,
  validateProductFilters
};
