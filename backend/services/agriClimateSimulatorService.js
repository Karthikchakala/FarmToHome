const axios = require('axios');
const cropCatalog = require('./agriCropCatalogService');

class AgriClimateSimulatorService {
  constructor() {
    this.remoteBaseUrl = (process.env.AI_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');
  }

  clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  scoreClimate(current, optimal, spread) {
    const delta = Math.abs(current - optimal);
    return this.clamp(Math.round(100 - (delta / Math.max(spread, 1)) * 100), 0, 100);
  }

  simulate({
    cropType,
    rainfall,
    temperature,
    humidity,
    areaAcres = 1,
    soilType = 'loamy',
    soilPh = 6.5,
    randomEvents = true,
    tickSpeed = 1,
    simulationDays = null
  }) {
    const remotePayload = {
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
    };

    return this.simulateRemote(remotePayload).catch(() => this.simulateLocal(remotePayload));
  }

  async simulateRemote(payload) {
    const response = await axios.post(`${this.remoteBaseUrl}/simulator/climate`, payload, {
      timeout: 15000
    });

    if (!response.data?.success || !response.data?.simulation) {
      throw new Error('Remote simulator returned an unexpected response');
    }

    return {
      success: true,
      simulation: response.data.simulation
    };
  }

  simulateLocal({
    cropType,
    rainfall,
    temperature,
    humidity,
    areaAcres = 1,
    soilType = 'loamy',
    soilPh = 6.5,
    randomEvents = true,
    tickSpeed = 1,
    simulationDays = null
  }) {
    const profile = cropCatalog.getProfile(cropType);
    if (!profile) {
      return {
        success: false,
        message: 'Crop type not supported'
      };
    }

    const rainfallValue = Number(rainfall);
    const temperatureValue = Number(temperature);
    const humidityValue = Number(humidity);
    const acres = Math.max(0.1, Number(areaAcres) || 1);
    const ph = Number(soilPh);
    const days = Math.max(1, Number(simulationDays) || profile.durationDays || 120);
    const soilMatch = (profile.preferredSoils || []).includes(String(soilType).toLowerCase());
    const rainfallImpact = this.scoreClimate(rainfallValue, profile.climate.rainfall, Math.max(profile.climate.rainfall, 1));
    const temperatureImpact = this.scoreClimate(temperatureValue, profile.climate.temperature, 14);
    const humidityImpact = this.scoreClimate(humidityValue, profile.climate.humidity, 25);
    const soilTypeImpact = soilMatch ? 100 : 70;
    const soilPhOptimal = profile.optimalPh || [6.5, 7.2];
    const phCenter = (soilPhOptimal[0] + soilPhOptimal[1]) / 2;
    const phImpact = this.scoreClimate(ph, phCenter, 2.5);
    const overall = Math.round(
      rainfallImpact * 0.28 +
      temperatureImpact * 0.24 +
      humidityImpact * 0.18 +
      soilTypeImpact * 0.15 +
      phImpact * 0.15
    );

    const stageProgress = this.clamp(Math.round((days / Math.max(profile.durationDays || 120, 1)) * 100), 0, 100);
    const stage =
      stageProgress < 25 ? 'Germination' :
      stageProgress < 55 ? 'Vegetative' :
      stageProgress < 85 ? 'Flowering' : 'Harvest';

    const baseYieldPerAcre = profile.baseYieldPerHectare * 0.404686;
    const stressFactor = this.clamp(0.4 + (overall / 100) * 0.6, 0.25, 1.15);
    const soilFactor = soilTypeImpact / 100;
    const phFactor = phImpact / 100;
    const expectedYieldPerAcre = baseYieldPerAcre * stressFactor * (0.75 + soilFactor * 0.15 + phFactor * 0.1);
    const expectedYieldTons = Math.max(0, Number((expectedYieldPerAcre * acres).toFixed(2)));
    const grossRevenue = Number((expectedYieldTons * profile.indicativeMarketPricePerTon).toFixed(0));
    const estimatedCost = Number((acres * profile.indicativeMarketPricePerTon * 0.45).toFixed(0));
    const estimatedProfit = grossRevenue - estimatedCost;

    const recommendations = [];
    if (rainfallValue > profile.climate.rainfall * 1.25) recommendations.push('High rainfall scenario: prepare drainage and watch for root disease.');
    if (rainfallValue < profile.climate.rainfall * 0.75) recommendations.push('Low rainfall scenario: review irrigation availability and mulching.');
    if (temperatureValue > profile.climate.temperature + 4) recommendations.push('Heat stress risk is elevated; monitor moisture loss and flower drop.');
    if (temperatureValue < profile.climate.temperature - 4) recommendations.push('Cooler conditions may slow growth; protect tender growth if needed.');
    if (humidityValue > profile.climate.humidity + 12) recommendations.push('Higher humidity increases fungal pressure; improve airflow and scouting.');
    if (!soilMatch) recommendations.push(`The selected soil type is not ideal for ${profile.displayName}.`);
    if (Math.abs(ph - phCenter) > 0.9) recommendations.push('Soil pH is drifting away from the ideal range.');
    if (randomEvents) {
      if (rainfallValue < profile.climate.rainfall * 0.7) recommendations.push('Random event risk: drought stress can reduce grain fill.');
      if (rainfallValue > profile.climate.rainfall * 1.3) recommendations.push('Random event risk: waterlogging may invite fungal issues.');
    }
    if (recommendations.length === 0) recommendations.push('Scenario remains close to the crop optimum and does not indicate major stress.');

    const events = [];
    if (randomEvents) {
      if (rainfallValue < profile.climate.rainfall * 0.75) {
        events.push({ type: 'Drought', severity: rainfallValue < profile.climate.rainfall * 0.55 ? 'high' : 'medium' });
      }
      if (rainfallValue > profile.climate.rainfall * 1.25) {
        events.push({ type: 'Flood', severity: rainfallValue > profile.climate.rainfall * 1.5 ? 'high' : 'medium' });
      }
      if (temperatureValue > profile.climate.temperature + 5) {
        events.push({ type: 'Heat Stress', severity: temperatureValue > profile.climate.temperature + 8 ? 'high' : 'medium' });
      }
      if (humidityValue > profile.climate.humidity + 15) {
        events.push({ type: 'Fungal Pressure', severity: 'medium' });
      }
    }

    return {
      success: true,
      simulation: {
        crop: profile.displayName,
        cropType: profile.key,
        optimalClimate: profile.climate,
        conditions: {
          rainfall: rainfallValue,
          temperature: temperatureValue,
          humidity: humidityValue,
          areaAcres: acres,
          soilType,
          soilPh: ph,
          days,
          tickSpeed: Number(tickSpeed) || 1
        },
        impacts: {
          rainfall: rainfallImpact,
          temperature: temperatureImpact,
          humidity: humidityImpact,
          soilType: soilTypeImpact,
          soilPh: phImpact,
          overall
        },
        growth: {
          day: days,
          maxDays: profile.durationDays || 120,
          stage,
          progress: stageProgress
        },
        economics: {
          expectedYieldPerAcre: Number(expectedYieldPerAcre.toFixed(2)),
          expectedYieldTons,
          grossRevenue,
          estimatedCost,
          estimatedProfit
        },
        events,
        riskLevel: overall >= 80 ? 'low' : overall >= 60 ? 'moderate' : 'high',
        recommendation: recommendations[0],
        recommendations,
        health: this.clamp(Math.round((overall + phImpact) / 2), 0, 100)
      }
    };
  }

  async getSupportedCropsRemote() {
    const response = await axios.get(`${this.remoteBaseUrl}/simulator/crops`, {
      timeout: 15000
    });

    if (!response.data?.success || !Array.isArray(response.data?.crops)) {
      throw new Error('Remote crop list returned an unexpected response');
    }

    return {
      success: true,
      crops: response.data.crops
    };
  }

  getSupportedCropsLocal() {
    return {
      success: true,
      crops: cropCatalog.getSupportedCrops().map(crop => ({
        key: crop.key,
        name: crop.name,
        climate: crop.climate,
        durationDays: crop.durationDays,
        preferredSoils: crop.preferredSoils,
        optimalPh: crop.optimalPh,
        category: crop.category,
        baseYieldPerHectare: crop.baseYieldPerHectare,
        indicativeMarketPricePerTon: crop.indicativeMarketPricePerTon
      }))
    };
  }

  async getSupportedCrops() {
    try {
      return await this.getSupportedCropsRemote();
    } catch (error) {
      return this.getSupportedCropsLocal();
    }
  }
}

module.exports = new AgriClimateSimulatorService();
