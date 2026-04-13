const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const {
  getChatResponse,
  getFarmingTips
} = require('../controllers/agriAiAssistantController');

// All AI assistant routes require authentication
router.use(authenticate);

router.post('/chat', getChatResponse);
router.get('/tips', getFarmingTips);

module.exports = router;
