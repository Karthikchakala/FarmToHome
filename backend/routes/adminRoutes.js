const express = require('express')
const router = express.Router()
const { getDashboardStats, getUsers, getUserById, updateUser, deleteUser, getFarmers, getFarmerProducts, approveFarmer, rejectFarmer, getAllProducts, getProductById, deleteProduct } = require('../controllers/adminController')
const { getAdminAnalytics } = require('../controllers/analyticsController')
const { getAllOrders } = require('../controllers/orderController')

// Middleware to check if user is admin
const adminAuth = (req, res, next) => {
  // Temporarily remove authentication for testing
  console.log('Admin auth middleware called')
  next()
  
  // Original auth code (commented out for testing)
  /*
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    })
  }

  // For testing, we'll allow any authenticated user
  // In production, verify the token and check if user.role === 'admin'
  next()
  */
}

// Dashboard routes
router.get('/dashboard/stats', adminAuth, getDashboardStats)

// Analytics routes
router.get('/analytics', adminAuth, getAdminAnalytics)

// User management routes
router.get('/users', adminAuth, getUsers)
router.get('/users/:id', adminAuth, getUserById)
router.put('/users/:id', adminAuth, updateUser)
router.delete('/users/:id', adminAuth, deleteUser)

// Farmer management routes
router.get('/farmers', adminAuth, getFarmers)
router.get('/farmers/:id/products', adminAuth, getFarmerProducts)
router.post('/farmers/:id/approve', adminAuth, approveFarmer)
router.post('/farmers/:id/reject', adminAuth, rejectFarmer)

// Product management routes
router.get('/products', adminAuth, getAllProducts)
router.get('/products/:id', adminAuth, getProductById)
router.delete('/products/:id', adminAuth, deleteProduct)

// Order management routes
router.get('/orders', adminAuth, getAllOrders)

module.exports = router
