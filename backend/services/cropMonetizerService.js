class CropMonetizerService {
  constructor() {
    // Mock market data - in real implementation, this would come from APIs
    this.marketData = {
      wheat: { currentPrice: 22000, trend: 'up', volatility: 0.15 },
      rice: { currentPrice: 28000, trend: 'stable', volatility: 0.10 },
      maize: { currentPrice: 19000, trend: 'down', volatility: 0.12 },
      tomato: { currentPrice: 16000, trend: 'up', volatility: 0.20 }
    };
  }

  getPriceForecast(cropType, days = 14) {
    try {
      const crop = this.marketData[cropType.toLowerCase()];
      if (!crop) {
        return {
          success: false,
          message: 'Crop type not supported for price forecasting'
        };
      }

      // Simple forecasting model
      const forecasts = [];
      let currentPrice = crop.currentPrice;

      for (let i = 1; i <= days; i++) {
        // Trend-based price movement
        let change = 0;
        if (crop.trend === 'up') {
          change = currentPrice * (0.002 + Math.random() * crop.volatility * 0.01);
        } else if (crop.trend === 'down') {
          change = currentPrice * (-0.002 - Math.random() * crop.volatility * 0.01);
        } else {
          change = currentPrice * (Math.random() - 0.5) * crop.volatility * 0.005;
        }

        currentPrice += change;
        forecasts.push({
          day: i,
          price: Math.max(1000, Math.round(currentPrice)), // Minimum price safeguard
          change: Math.round(change)
        });
      }

      const avgForecastPrice = forecasts.reduce((sum, f) => sum + f.price, 0) / forecasts.length;
      const recommendation = avgForecastPrice > crop.currentPrice ? 'hold' : 'sell';

      return {
        success: true,
        forecast: {
          crop_type: cropType,
          current_price: crop.currentPrice,
          average_forecast: Math.round(avgForecastPrice),
          recommendation,
          confidence: 0.75,
          forecasts
        }
      };
    } catch (error) {
      console.error('Price Forecast Error:', error.message);
      return {
        success: false,
        message: 'Failed to generate price forecast',
        error: error.message
      };
    }
  }

  getMarketInsights(cropType) {
    const crop = this.marketData[cropType.toLowerCase()];
    if (!crop) return null;

    const insights = {
      trend: crop.trend,
      volatility: `${Math.round(crop.volatility * 100)}%`,
      recommendation: crop.trend === 'up' ? 'Consider holding for better prices' :
                     crop.trend === 'down' ? 'Consider selling soon' :
                     'Monitor market closely'
    };

    return insights;
  }
}

module.exports = new CropMonetizerService();