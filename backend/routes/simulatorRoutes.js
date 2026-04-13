const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const {
  simulateClimate,
  getClimateCrops
} = require('../controllers/agriClimateSimulatorController');

router.use(authenticate);

router.get('/crops', getClimateCrops);
router.post('/climate', simulateClimate);
router.post('/simulate', simulateClimate);

module.exports = router;
