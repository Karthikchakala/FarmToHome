const asyncHandler = require('express-async-handler');
const yieldPredictorService = require('../services/agriYieldPredictorService');

const predictYield = asyncHandler(async (req, res) => {
  const { cropType, fieldArea, rainfall, temperature, soilQuality, humidity } = req.body;

  if (!cropType || !fieldArea || rainfall === undefined || temperature === undefined || soilQuality === undefined) {
    return res.status(400).json({
      success: false,
      message: 'All parameters are required: cropType, fieldArea, rainfall, temperature, soilQuality'
    });
  }

  const result = yieldPredictorService.predictYield(
    cropType,
    Number(fieldArea),
    Number(rainfall),
    Number(temperature),
    Number(soilQuality),
    humidity === undefined ? null : Number(humidity)
  );

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message
    });
  }

  return res.json({
    success: true,
    data: result.prediction
  });
});

const getSupportedCrops = asyncHandler(async (req, res) => {
  const result = yieldPredictorService.getSupportedCrops();
  return res.json({
    success: true,
    data: result
  });
});

module.exports = {
  predictYield,
  getSupportedCrops
};
