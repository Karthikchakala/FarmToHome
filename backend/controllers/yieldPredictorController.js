const asyncHandler = require('express-async-handler');
const yieldPredictorService = require('../services/yieldPredictorService');

const predictYield = asyncHandler(async (req, res) => {
  const { cropType, fieldArea, rainfall, temperature, soilQuality } = req.body;

  // Validation
  if (!cropType || !fieldArea || rainfall === undefined || temperature === undefined || soilQuality === undefined) {
    return res.status(400).json({
      success: false,
      message: 'All parameters are required: cropType, fieldArea, rainfall, temperature, soilQuality'
    });
  }

  if (fieldArea <= 0 || soilQuality < 1 || soilQuality > 10) {
    return res.status(400).json({
      success: false,
      message: 'Invalid parameter values'
    });
  }

  const result = yieldPredictorService.predictYield(cropType, fieldArea, rainfall, temperature, soilQuality);

  if (result.success) {
    res.json({
      success: true,
      data: result.prediction
    });
  } else {
    res.status(400).json({
      success: false,
      message: result.message
    });
  }
});

const getSupportedCrops = asyncHandler(async (req, res) => {
  const result = yieldPredictorService.getSupportedCrops();

  res.json({
    success: true,
    data: result
  });
});

module.exports = {
  predictYield,
  getSupportedCrops
};