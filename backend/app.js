const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const logger = require('./config/logger');
const { generalLimiter, authLimiter, orderLimiter, messageLimiter, searchLimiter } = require('./middlewares/rateLimiter');
const { authenticate, authorize } = require('./middlewares/auth');
const errorHandler = require('./middlewares/errorHandler');
const ChatSocket = require('./sockets/chatSocket');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const messageRoutes = require('./routes/messages');
const profileRoutes = require('./routes/profile');
const subscriptionRoutes = require('./routes/subscriptions');
const paymentRoutes = require('./routes/payments');
const farmerProductRoutes = require('./routes/farmerProducts');
const reviewRoutes = require('./routes/reviews');
const emailRoutes = require('./routes/email');
const testProductsRoutes = require('./routes/testProducts');
const testAuthRoutes = require('./routes/testAuth');
const adminRoutes = require('./routes/adminRoutes');
const customerRoutes = require('./routes/customerRoutes');
const feedbackRoutes = require('./routes/feedback');
const notificationRoutes = require('./routes/notifications');
const chatRoutes = require('./routes/chatRoutes');
const { healthCheck } = require('./db');
const subscriptionProcessor = require('./jobs/subscriptionProcessor');

// Initialize express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Apply general rate limiting to all API routes
app.use('/api', generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes with specific rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', searchLimiter, productRoutes);
app.use('/api/products-test', testProductsRoutes);
app.use('/api/test-auth', testAuthRoutes);
app.use('/api/cart', authenticate, cartRoutes);
app.use('/api/orders', authenticate, orderRoutes);
app.use('/api/messages', authenticate, messageLimiter, messageRoutes);
app.use('/api/profile', authenticate, profileRoutes);
app.use('/api/subscriptions', authenticate, subscriptionRoutes);
app.use('/api/payments', authenticate, paymentRoutes);
app.use('/api/farmer', authenticate, farmerProductRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);

// Create HTTP server
const server = http.createServer(app);

// Create Socket.io server
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store io instance in app for use in controllers
app.set('io', io);

// Initialize chat socket handlers
const chatSocket = new ChatSocket(io);

// Export the server instance for use in server.js
module.exports = app;
app.set('server', server);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealthy = await healthCheck();
    res.status(200).json({
      success: true,
      message: 'Server is healthy',
      database: dbHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Server health check failed',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Farm to Table API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      products: '/api/products',
      cart: '/api/cart',
      orders: '/api/orders',
      messages: '/api/messages',
      profile: '/api/profile',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      profile: 'GET /api/auth/profile',
      featuredProducts: 'GET /api/products/featured',
      allProducts: 'GET /api/products',
      searchProducts: 'GET /api/products/search',
      addToCart: 'POST /api/cart/add',
      getCart: 'GET /api/cart',
      updateCart: 'PUT /api/cart/update',
      removeFromCart: 'DELETE /api/cart/remove',
      placeOrder: 'POST /api/orders',
      getOrders: 'GET /api/orders',
      getOrderDetails: 'GET /api/orders/:id',
      cancelOrder: 'DELETE /api/orders/:id/cancel',
      sendMessage: 'POST /api/messages/send',
      getMessages: 'GET /api/messages',
      getRecentChats: 'GET /api/messages/recent',
      getProfile: 'GET /api/profile',
      updateCustomerProfile: 'PUT /api/profile/customer',
      updateCustomerLocation: 'PUT /api/profile/customer/location',
      updateFarmerProfile: 'PUT /api/profile/farmer',
      getNearbyFarmers: 'GET /api/profile/nearby-farmers',
      validateDelivery: 'POST /api/profile/validate-delivery'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start subscription processor
subscriptionProcessor.start();

module.exports = app;
