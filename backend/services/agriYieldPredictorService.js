const cropCatalog = require('./agriCropCatalogService');

class AgriYieldPredictorService {
  calculateWeatherScore(input, profile) {
    const rainfallDelta = Math.abs(input.rainfall - profile.climate.rainfall);
    const temperatureDelta = Math.abs(input.temperature - profile.climate.temperature);
    const humidityDelta = Math.abs((input.humidity ?? profile.climate.humidity) - profile.climate.humidity);

    const rainfallScore = Math.max(0.45, 1 - rainfallDelta / 180);
    const temperatureScore = Math.max(0.45, 1 - temperatureDelta / 25);
    const humidityScore = Math.max(0.5, 1 - humidityDelta / 80);

    return {
      rainfallScore,
      temperatureScore,
      humidityScore,
      overall: (rainfallScore + temperatureScore + humidityScore) / 3
    };
  }

  buildRecommendations(scores) {
    const recommendations = [];

    if (scores.rainfallScore < 0.8) recommendations.push('Rainfall is away from the crop optimum, so irrigation or drainage planning should be reviewed.');
    if (scores.temperatureScore < 0.8) recommendations.push('Temperature stress may reduce yield quality or maturity consistency.');
    if (scores.humidityScore < 0.8) recommendations.push('Humidity variation may increase disease pressure or affect crop vigor.');
    if (recommendations.length === 0) recommendations.push('Climate inputs are close to the crop optimum, which supports stable yield expectations.');

    return recommendations;
  }

  predictYield(cropType, fieldArea, rainfall, temperature, soilQuality, humidity = null) {
    try {
      const profile = cropCatalog.getProfile(cropType);
      if (!profile) {
        return {
          success: false,
          message: 'Crop type not supported'
        };
      }

      const scores = this.calculateWeatherScore(
        { rainfall, temperature, humidity },
        profile
      );

      const soilScore = Math.max(0.5, Math.min(1.25, 0.6 + (soilQuality / 10) * profile.soilQualityWeight * 2.4));
      const yieldPerHectare = Math.max(0.1, profile.baseYieldPerHectare * scores.overall * soilScore);
      const totalYield = yieldPerHectare * fieldArea;
      const estimatedRevenue = totalYield * profile.indicativeMarketPricePerTon;
      const confidence = Math.max(0.62, Math.min(0.91, 0.55 + (scores.overall * 0.25) + ((soilQuality / 10) * 0.12)));

      return {
        success: true,
        prediction: {
          crop_type: profile.displayName,
          field_area: fieldArea,
          yield_per_hectare: Number(yieldPerHectare.toFixed(2)),
          total_yield: Number(totalYield.toFixed(2)),
          estimated_revenue: Math.round(estimatedRevenue),
          confidence: Number(confidence.toFixed(2)),
          breakdown: {
            rainfallScore: Number((scores.rainfallScore * 100).toFixed(0)),
            temperatureScore: Number((scores.temperatureScore * 100).toFixed(0)),
            humidityScore: Number((scores.humidityScore * 100).toFixed(0)),
            soilScore: Number((soilScore * 100).toFixed(0))
          },
          recommendations: this.buildRecommendations(scores)
        }
      };
    } catch (error) {
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
      crops: cropCatalog.getSupportedCrops()
    };
  }
}

module.exports = new AgriYieldPredictorService();
