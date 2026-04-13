const asyncHandler = require('express-async-handler');
const climateService = require('../services/agriClimateSimulatorService');

const simulateClimate = asyncHandler(async (req, res) => {
  const {
    cropType,
    rainfall,
    temperature,
    humidity,
    areaAcres,
    soilType,
    soilPh,
    randomEvents,
    tickSpeed,
    simulationDays
  } = req.body;

  if (!cropType || rainfall === undefined || temperature === undefined || humidity === undefined) {
    return res.status(400).json({
      success: false,
      message: 'cropType, rainfall, temperature, and humidity are required'
    });
  }

  const result = await climateService.simulate({
    cropType,
    rainfall: Number(rainfall),
    temperature: Number(temperature),
    humidity: Number(humidity),
    areaAcres: Number(areaAcres),
    soilType,
    soilPh: Number(soilPh),
    randomEvents: randomEvents !== false && randomEvents !== 'false',
    tickSpeed: Number(tickSpeed),
    simulationDays: simulationDays ? Number(simulationDays) : undefined
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message
    });
  }

  return res.json({
    success: true,
    data: result.simulation
  });
});

const getClimateCrops = asyncHandler(async (req, res) => {
  const result = await climateService.getSupportedCrops();
  return res.json({
    success: true,
    data: result
  });
});

module.exports = {
  simulateClimate,
  getClimateCrops
};
