const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile } = require('../controllers/authControllerSupabase');
const { authenticate } = require('../middlewares/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

module.exports = router;
