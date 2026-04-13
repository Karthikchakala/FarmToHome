const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const {
  getPriceForecast,
  getMarketInsights,
  getSupportedCrops
} = require('../controllers/agriCropMonetizerController');

// All crop monetizer routes require authentication
router.use(authenticate);

router.get('/forecast', getPriceForecast);
router.get('/insights/:cropType', getMarketInsights);
router.get('/crops', getSupportedCrops);

module.exports = router;
