const asyncHandler = require('express-async-handler');
const cropMonetizerService = require('../services/cropMonetizerService');

const getPriceForecast = asyncHandler(async (req, res) => {
  const { cropType, days } = req.query;

  if (!cropType) {
    return res.status(400).json({
      success: false,
      message: 'Crop type is required'
    });
  }

  const forecastDays = days ? parseInt(days) : 14;
  if (forecastDays < 1 || forecastDays > 30) {
    return res.status(400).json({
      success: false,
      message: 'Days must be between 1 and 30'
    });
  }

  const result = cropMonetizerService.getPriceForecast(cropType, forecastDays);

  if (result.success) {
    res.json({
      success: true,
      data: result.forecast
    });
  } else {
    res.status(400).json({
      success: false,
      message: result.message
    });
  }
});

const getMarketInsights = asyncHandler(async (req, res) => {
  const { cropType } = req.params;

  if (!cropType) {
    return res.status(400).json({
      success: false,
      message: 'Crop type is required'
    });
  }

  const insights = cropMonetizerService.getMarketInsights(cropType);

  if (insights) {
    res.json({
      success: true,
      data: insights
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Crop type not found'
    });
  }
});

module.exports = {
  getPriceForecast,
  getMarketInsights
};