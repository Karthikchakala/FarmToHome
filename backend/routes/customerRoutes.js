const express = require('express')
const router = express.Router()
const { getDashboardData } = require('../controllers/customerController')
const { authenticate } = require('../middlewares/auth')

// Middleware to check if user is authenticated
router.use(authenticate)

// Customer dashboard routes
router.get('/dashboard', getDashboardData)

module.exports = router
