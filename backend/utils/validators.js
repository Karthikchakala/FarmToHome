// Input validation utilities
const validator = {
  // Email validation
  isEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Phone number validation (Indian format)
  isPhone: (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  },

  // Password validation (min 8 chars, at least 1 uppercase, 1 lowercase, 1 number)
  isStrongPassword: (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },

  // Name validation (letters only, min 2 chars)
  isName: (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name);
  },

  // UUID validation
  isUUID: (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  // Price validation (positive decimal with 2 places)
  isPrice: (price) => {
    const priceRegex = /^\d+(\.\d{1,2})?$/;
    return priceRegex.test(price) && parseFloat(price) > 0;
  },

  // Quantity validation (positive integer)
  isQuantity: (quantity) => {
    const quantityRegex = /^[1-9]\d*$/;
    return quantityRegex.test(quantity);
  },

  // URL validation
  isURL: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Text validation (no HTML tags, max length)
  isText: (text, maxLength = 1000) => {
    const htmlRegex = /<[^>]*>/g;
    return !htmlRegex.test(text) && text.length <= maxLength;
  },

  // Address validation (basic)
  isAddress: (address) => {
    return address && address.trim().length >= 10 && address.trim().length <= 500;
  },

  // Pincode validation (Indian format)
  isPincode: (pincode) => {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
  },

  // Validate required fields
  validateRequired: (fields, data) => {
    const errors = {};
    
    for (const field of fields) {
      if (!data[field] || data[field].toString().trim() === '') {
        errors[field] = `${field} is required`;
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Validate user registration
  validateUserRegistration: (userData) => {
    const errors = {};
    
    if (!userData.name || !validator.isName(userData.name)) {
      errors.name = 'Valid name is required (2-50 characters, letters only)';
    }
    
    if (!userData.email || !validator.isEmail(userData.email)) {
      errors.email = 'Valid email is required';
    }
    
    if (!userData.password || !validator.isStrongPassword(userData.password)) {
      errors.password = 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number';
    }
    
    if (userData.phone && !validator.isPhone(userData.phone)) {
      errors.phone = 'Valid phone number is required (10 digits starting with 6-9)';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Validate product data
  validateProduct: (productData) => {
    const errors = {};
    
    if (!productData.name || !validator.isText(productData.name, 100)) {
      errors.name = 'Product name is required (max 100 characters)';
    }
    
    if (!productData.description || !validator.isText(productData.description, 1000)) {
      errors.description = 'Description is required (max 1000 characters)';
    }
    
    if (!productData.price || !validator.isPrice(productData.price)) {
      errors.price = 'Valid price is required (positive number with max 2 decimal places)';
    }
    
    if (!productData.stockquantity || !validator.isQuantity(productData.stockquantity)) {
      errors.stockquantity = 'Valid stock quantity is required (positive integer)';
    }
    
    if (!productData.unit || !validator.isText(productData.unit, 20)) {
      errors.unit = 'Unit is required (max 20 characters)';
    }
    
    if (!productData.category || !validator.isText(productData.category, 50)) {
      errors.category = 'Category is required (max 50 characters)';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Validate order data
  validateOrder: (orderData) => {
    const errors = {};
    
    if (!orderData.deliveryaddress || !validator.isAddress(orderData.deliveryaddress)) {
      errors.deliveryaddress = 'Valid delivery address is required (10-500 characters)';
    }
    
    if (!orderData.paymentmethod || !['COD', 'ONLINE'].includes(orderData.paymentmethod)) {
      errors.paymentmethod = 'Valid payment method is required (COD or ONLINE)';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Validate message data
  validateMessage: (messageData) => {
    const errors = {};
    
    if (!messageData.receiverId || !validator.isUUID(messageData.receiverId)) {
      errors.receiverId = 'Valid receiver ID is required';
    }
    
    if (!messageData.message || !validator.isText(messageData.message, 500)) {
      errors.message = 'Message is required (max 500 characters)';
    }
    
    if (messageData.orderId && !validator.isUUID(messageData.orderId)) {
      errors.orderId = 'Valid order ID is required';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Sanitize input (remove HTML tags, trim whitespace)
  sanitize: (input) => {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  },

  // Validate search query
  validateSearchQuery: (query) => {
    const errors = {};
    
    if (query && query.length > 100) {
      errors.query = 'Search query is too long (max 100 characters)';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized: validator.sanitize(query || '')
    };
  },

  // Validate pagination parameters
  validatePagination: (page, limit) => {
    const errors = {};
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    
    if (pageNum < 1) {
      errors.page = 'Page must be at least 1';
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.limit = 'Limit must be between 1 and 100';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      page: pageNum,
      limit: limitNum
    };
  }
};

module.exports = validator;
