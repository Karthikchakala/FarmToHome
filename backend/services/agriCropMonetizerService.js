const supabase = require('./../config/supabaseClient');
const cropCatalog = require('./agriCropCatalogService');

class AgriCropMonetizerService {
  async getMarketplaceSignals(cropType) {
    try {
      const { data: products } = await supabase
        .from('products')
        .select('name, unit, priceperunit, stockquantity, farmerid')
        .ilike('name', `%${cropType}%`)
        .eq('isavailable', true)
        .limit(100);

      const normalized = (products || []).map(product => {
        let pricePerTon = null;
        if (product.unit === 'kg') pricePerTon = product.priceperunit * 1000;
        if (product.unit === 'gram') pricePerTon = product.priceperunit * 1000000;

        return { ...product, pricePerTon };
      }).filter(product => Number.isFinite(product.pricePerTon));

      if (normalized.length === 0) {
        return { averagePricePerTon: null, stockVolume: 0, sellerCount: 0 };
      }

      const averagePricePerTon = normalized.reduce((sum, product) => sum + product.pricePerTon, 0) / normalized.length;
      const stockVolume = normalized.reduce((sum, product) => sum + (product.stockquantity || 0), 0);
      const sellerCount = new Set(normalized.map(product => product.farmerid)).size;

      return { averagePricePerTon, stockVolume, sellerCount };
    } catch (error) {
      return { averagePricePerTon: null, stockVolume: 0, sellerCount: 0 };
    }
  }

  async getPriceForecast(cropType, days = 14, options = {}) {
    try {
      const profile = cropCatalog.getProfile(cropType);
      if (!profile) {
        return {
          success: false,
          message: 'Crop type not supported for price forecasting'
        };
      }

      const quantity = Number(options.quantity || 1000);
      const storageCostPerDay = Number(options.storageCostPerDay || 0);
      const marketplaceSignals = await this.getMarketplaceSignals(profile.key);
      const currentPrice = Math.round(marketplaceSignals.averagePricePerTon || profile.indicativeMarketPricePerTon);

      const scarcityFactor = marketplaceSignals.stockVolume > 0
        ? Math.max(-0.06, Math.min(0.08, (500 - marketplaceSignals.stockVolume) / 5000))
        : 0.03;
      const storageRiskFactor = profile.storageRisk === 'high' ? -0.015 : profile.storageRisk === 'medium' ? 0.002 : 0.008;

      const forecasts = [];
      let projected = currentPrice;
      for (let day = 1; day <= days; day += 1) {
        const dailyChange = projected * ((scarcityFactor / days) + (storageRiskFactor / days));
        projected = Math.max(5000, projected + dailyChange);
        forecasts.push({
          day,
          price: Math.round(projected),
          change: Math.round(dailyChange)
        });
      }

      const averageForecast = forecasts.reduce((sum, item) => sum + item.price, 0) / forecasts.length;
      const projectedPrice = forecasts[forecasts.length - 1].price;
      const currentRevenue = (currentPrice / 1000) * quantity;
      const totalStorageCost = storageCostPerDay * quantity * days;
      const futureRevenue = (projectedPrice / 1000) * quantity - totalStorageCost;
      const recommendation = futureRevenue > currentRevenue ? 'hold' : 'sell';

      return {
        success: true,
        forecast: {
          crop_type: profile.displayName,
          current_price: currentPrice,
          average_forecast: Math.round(averageForecast),
          projected_price: projectedPrice,
          recommendation,
          confidence: marketplaceSignals.averagePricePerTon ? 0.82 : 0.68,
          quantity,
          current_revenue: Math.round(currentRevenue),
          future_revenue: Math.round(futureRevenue),
          total_storage_cost: Math.round(totalStorageCost),
          marketplace_signals: marketplaceSignals,
          forecasts
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to generate price forecast',
        error: error.message
      };
    }
  }

  async getMarketInsights(cropType) {
    const profile = cropCatalog.getProfile(cropType);
    if (!profile) return null;

    const signals = await this.getMarketplaceSignals(profile.key);
    const trend = !signals.averagePricePerTon
      ? 'stable'
      : signals.stockVolume < 200
        ? 'up'
        : signals.stockVolume > 800
          ? 'down'
          : 'stable';

    return {
      crop: profile.displayName,
      trend,
      volatility: profile.storageRisk === 'high' ? '22%' : profile.storageRisk === 'medium' ? '14%' : '9%',
      sellerCount: signals.sellerCount,
      activeStock: signals.stockVolume,
      recommendation: trend === 'up'
        ? 'Supply is relatively tight, so delaying sale may improve returns if storage is safe.'
        : trend === 'down'
          ? 'Supply looks heavier, so faster listing may reduce price risk.'
          : 'Market is balanced; compare storage cost and expected cash needs before waiting.'
    };
  }
}

module.exports = new AgriCropMonetizerService();
