const asyncHandler = require('express-async-handler');
const cropMonetizerService = require('../services/agriCropMonetizerService');
const cropCatalog = require('../services/agriCropCatalogService');

const getPriceForecast = asyncHandler(async (req, res) => {
  const { cropType, days, quantity, storageCostPerDay } = req.query;

  if (!cropType) {
    return res.status(400).json({
      success: false,
      message: 'Crop type is required'
    });
  }

  const result = await cropMonetizerService.getPriceForecast(cropType, Number(days || 14), {
    quantity,
    storageCostPerDay
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message
    });
  }

  return res.json({
    success: true,
    data: result.forecast
  });
});

const getMarketInsights = asyncHandler(async (req, res) => {
  const { cropType } = req.params;
  const insights = await cropMonetizerService.getMarketInsights(cropType);

  if (!insights) {
    return res.status(404).json({
      success: false,
      message: 'Crop type not found'
    });
  }

  return res.json({
    success: true,
    data: insights
  });
});

const getSupportedCrops = asyncHandler(async (req, res) => {
  return res.json({
    success: true,
    data: {
      crops: cropCatalog.getSupportedCrops()
    }
  });
});

module.exports = {
  getPriceForecast,
  getMarketInsights,
  getSupportedCrops
};
