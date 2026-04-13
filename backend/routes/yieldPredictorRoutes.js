const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const {
  predictYield,
  getSupportedCrops
} = require('../controllers/agriYieldPredictorController');

// All yield predictor routes require authentication
router.use(authenticate);

router.post('/predict', predictYield);
router.get('/crops', getSupportedCrops);

module.exports = router;
