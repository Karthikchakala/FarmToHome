const CROP_PROFILES = {
  wheat: {
    key: 'wheat',
    displayName: 'Wheat',
    category: 'grain',
    baseYieldPerHectare: 3.6,
    indicativeMarketPricePerTon: 22000,
    climate: { rainfall: 75, temperature: 18, humidity: 50 },
    durationDays: 120,
    preferredSoils: ['loamy', 'clay'],
    optimalPh: [6.0, 7.5],
    soilQualityWeight: 0.18,
    storageRisk: 'low',
    tags: ['grain', 'cereal']
  },
  rice: {
    key: 'rice',
    displayName: 'Rice',
    category: 'grain',
    baseYieldPerHectare: 4.4,
    indicativeMarketPricePerTon: 28000,
    climate: { rainfall: 140, temperature: 26, humidity: 72 },
    durationDays: 150,
    preferredSoils: ['clay', 'loamy'],
    optimalPh: [5.5, 6.5],
    soilQualityWeight: 0.22,
    storageRisk: 'low',
    tags: ['paddy', 'grain']
  },
  maize: {
    key: 'maize',
    displayName: 'Maize',
    category: 'grain',
    baseYieldPerHectare: 5.1,
    indicativeMarketPricePerTon: 19500,
    climate: { rainfall: 85, temperature: 24, humidity: 60 },
    durationDays: 110,
    preferredSoils: ['loamy', 'sandy'],
    optimalPh: [5.8, 7.2],
    soilQualityWeight: 0.2,
    storageRisk: 'low',
    tags: ['corn', 'grain'],
    aliases: ['corn']
  },
  tomato: {
    key: 'tomato',
    displayName: 'Tomato',
    category: 'vegetable',
    baseYieldPerHectare: 24,
    indicativeMarketPricePerTon: 16000,
    climate: { rainfall: 60, temperature: 24, humidity: 65 },
    durationDays: 90,
    preferredSoils: ['loamy', 'red'],
    optimalPh: [6.0, 7.0],
    soilQualityWeight: 0.16,
    storageRisk: 'high',
    tags: ['vegetable']
  },
  onion: {
    key: 'onion',
    displayName: 'Onion',
    category: 'vegetable',
    baseYieldPerHectare: 18,
    indicativeMarketPricePerTon: 19000,
    climate: { rainfall: 55, temperature: 22, humidity: 58 },
    durationDays: 110,
    preferredSoils: ['loamy', 'sandy'],
    optimalPh: [6.0, 7.0],
    soilQualityWeight: 0.15,
    storageRisk: 'medium',
    tags: ['vegetable']
  },
  potato: {
    key: 'potato',
    displayName: 'Potato',
    category: 'vegetable',
    baseYieldPerHectare: 20,
    indicativeMarketPricePerTon: 17500,
    climate: { rainfall: 65, temperature: 20, humidity: 62 },
    durationDays: 100,
    preferredSoils: ['loamy', 'sandy'],
    optimalPh: [5.5, 6.5],
    soilQualityWeight: 0.17,
    storageRisk: 'medium',
    tags: ['vegetable', 'tuber']
  },
  chilli: {
    key: 'chilli',
    displayName: 'Chilli',
    category: 'spice',
    baseYieldPerHectare: 3.2,
    indicativeMarketPricePerTon: 60000,
    climate: { rainfall: 70, temperature: 27, humidity: 60 },
    durationDays: 120,
    preferredSoils: ['loamy', 'black'],
    optimalPh: [6.0, 7.5],
    soilQualityWeight: 0.14,
    storageRisk: 'medium',
    tags: ['pepper', 'spice']
  },
  cotton: {
    key: 'cotton',
    displayName: 'Cotton',
    category: 'cash_crop',
    baseYieldPerHectare: 2.1,
    indicativeMarketPricePerTon: 52000,
    climate: { rainfall: 75, temperature: 28, humidity: 50 },
    durationDays: 180,
    preferredSoils: ['black', 'loamy'],
    optimalPh: [6.0, 8.0],
    soilQualityWeight: 0.16,
    storageRisk: 'low',
    tags: ['cash crop']
  },
  sugarcane: {
    key: 'sugarcane',
    displayName: 'Sugarcane',
    category: 'cash_crop',
    baseYieldPerHectare: 80,
    indicativeMarketPricePerTon: 3800,
    climate: { rainfall: 130, temperature: 28, humidity: 70 },
    durationDays: 360,
    preferredSoils: ['loamy', 'clay'],
    optimalPh: [6.0, 7.5],
    soilQualityWeight: 0.25,
    storageRisk: 'low',
    tags: ['cash crop', 'tropical']
  }
};

class AgriCropCatalogService {
  normalizeCropKey(cropName = '') {
    const normalized = String(cropName).trim().toLowerCase();
    const directMatch = Object.keys(CROP_PROFILES).find(key => key === normalized);
    if (directMatch) return directMatch;

    const tagMatch = Object.values(CROP_PROFILES).find(profile =>
      profile.displayName.toLowerCase() === normalized ||
      profile.tags.some(tag => tag === normalized) ||
      (profile.aliases || []).some(alias => alias === normalized)
    );

    return tagMatch?.key || null;
  }

  getProfile(cropName) {
    const key = this.normalizeCropKey(cropName);
    return key ? CROP_PROFILES[key] : null;
  }

  getSupportedCrops() {
    return Object.values(CROP_PROFILES).map(profile => ({
      key: profile.key,
      name: profile.displayName,
      category: profile.category,
      baseYieldPerHectare: profile.baseYieldPerHectare,
      indicativeMarketPricePerTon: profile.indicativeMarketPricePerTon,
      climate: profile.climate,
      durationDays: profile.durationDays,
      preferredSoils: profile.preferredSoils || [],
      optimalPh: profile.optimalPh || null,
      storageRisk: profile.storageRisk
    }));
  }
}

module.exports = new AgriCropCatalogService();
