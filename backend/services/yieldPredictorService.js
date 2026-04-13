class YieldPredictorService {
  constructor() {
    // Simple prediction model - in real implementation, this would use ML
    this.cropData = {
      wheat: { baseYield: 3.5, factors: { rainfall: 0.02, temperature: -0.01, soilQuality: 0.1 } },
      rice: { baseYield: 4.2, factors: { rainfall: 0.03, temperature: -0.015, soilQuality: 0.12 } },
      maize: { baseYield: 5.0, factors: { rainfall: 0.025, temperature: -0.02, soilQuality: 0.15 } },
      tomato: { baseYield: 25, factors: { rainfall: 0.01, temperature: -0.005, soilQuality: 0.08 } }
    };
  }

  predictYield(cropType, fieldArea, rainfall, temperature, soilQuality) {
    try {
      const crop = this.cropData[cropType.toLowerCase()];
      if (!crop) {
        return {
          success: false,
          message: 'Crop type not supported'
        };
      }

      // Simple linear prediction model
      const rainfallEffect = (rainfall - 100) * crop.factors.rainfall; // 100cm is optimal
      const tempEffect = (temperature - 25) * crop.factors.temperature; // 25°C is optimal
      const soilEffect = (soilQuality / 10) * crop.factors.soilQuality; // soilQuality 1-10

      const predictedYield = crop.baseYield * (1 + rainfallEffect + tempEffect + soilEffect);
      const totalYield = predictedYield * fieldArea;

      // Estimate revenue (rough prices per ton)
      const prices = { wheat: 20000, rice: 25000, maize: 18000, tomato: 15000 };
      const estimatedRevenue = totalYield * (prices[cropType.toLowerCase()] || 20000);

      return {
        success: true,
        prediction: {
          crop_type: cropType,
          field_area: fieldArea,
          yield_per_hectare: Math.max(0, predictedYield),
          total_yield: Math.max(0, totalYield),
          estimated_revenue: Math.max(0, estimatedRevenue),
          confidence: 0.75 // Mock confidence score
        }
      };
    } catch (error) {
      console.error('Yield Prediction Error:', error.message);
      return {
        success: false,
        message: 'Failed to predict yield',
        error: error.message
      };
    }
  }

  getSupportedCrops() {
    return {
      success: true,
      crops: Object.keys(this.cropData)
    };
  }
}

module.exports = new YieldPredictorService();