export const SOURCE_CROP_PROFILES = {
  wheat: { key: 'wheat', name: 'Wheat', daysToHarvest: 120, idealTemp: { min: 15, max: 25 }, idealRain: { min: 40, max: 80 }, idealPH: { min: 6.0, max: 7.0 }, idealSoil: ['loamy', 'clay'], baseYieldPerAcre: 2.5, pricePerTon: 250, accent: '#fbbf24' },
  corn: { key: 'corn', name: 'Corn', daysToHarvest: 90, idealTemp: { min: 20, max: 30 }, idealRain: { min: 60, max: 120 }, idealPH: { min: 5.8, max: 7.0 }, idealSoil: ['loamy'], baseYieldPerAcre: 4.0, pricePerTon: 180, accent: '#84cc16' },
  rice: { key: 'rice', name: 'Rice', daysToHarvest: 140, idealTemp: { min: 22, max: 32 }, idealRain: { min: 150, max: 300 }, idealPH: { min: 5.5, max: 6.5 }, idealSoil: ['clay', 'loamy'], baseYieldPerAcre: 3.5, pricePerTon: 320, accent: '#22c55e' },
  tomato: { key: 'tomato', name: 'Tomato', daysToHarvest: 80, idealTemp: { min: 20, max: 28 }, idealRain: { min: 40, max: 90 }, idealPH: { min: 6.0, max: 6.8 }, idealSoil: ['loamy', 'sandy'], baseYieldPerAcre: 5.0, pricePerTon: 800, accent: '#ef4444' },
  sugarcane: { key: 'sugarcane', name: 'Sugarcane', daysToHarvest: 360, idealTemp: { min: 25, max: 35 }, idealRain: { min: 150, max: 250 }, idealPH: { min: 6.0, max: 7.5 }, idealSoil: ['loamy', 'clay'], baseYieldPerAcre: 30.0, pricePerTon: 40, accent: '#65a30d' },
}

export const SIMULATION_EVENTS = [
  { id: 'drought', name: 'Severe Drought', icon: 'sun', color: '#f59e0b', durationRange: [7, 21], damagePerDay: 1.5, weather: 'drought', desc: 'Lack of water is drying out the crops rapidly.' },
  { id: 'flood', name: 'Flash Flood', icon: 'rain', color: '#3b82f6', durationRange: [3, 7], damagePerDay: 2.5, weather: 'flooded', desc: 'Heavy rainfall has flooded the field and stressed the roots.' },
  { id: 'pest', name: 'Pest Infestation', icon: 'bug', color: '#84cc16', durationRange: [5, 14], damagePerDay: 1.0, weather: 'normal', desc: 'Locusts and aphids are attacking the vegetative matter.' },
]

export const STAGE_LABELS = ['', 'Germination', 'Vegetative', 'Flowering', 'Harvest']

export const DEFAULT_SCENARIO = {
  areaAcres: 50,
  soilType: 'loamy',
  soilPh: 6.5,
  rainfall: 100,
  temperature: 22,
  humidity: 60,
  tickSpeed: 1,
  randomEvents: true,
}

export const CROP_ICON_MAP = {
  wheat: 'grain',
  corn: 'sunflower',
  rice: 'water',
  tomato: 'fruit',
  sugarcane: 'forest',
}

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export const scoreClimate = (current, optimal, spread) => {
  const delta = Math.abs(Number(current) - Number(optimal))
  return clamp(Math.round(100 - (delta / Math.max(spread, 1)) * 100), 0, 100)
}

export const normalizeCropKey = (key) => (key === 'maize' ? 'corn' : key)

export const buildSimulationSnapshot = (cropKey, scenario, options = {}) => {
  const profile = SOURCE_CROP_PROFILES[cropKey] || SOURCE_CROP_PROFILES.wheat
  const rainTarget = (profile.idealRain.min + profile.idealRain.max) / 2
  const tempTarget = (profile.idealTemp.min + profile.idealTemp.max) / 2
  const phTarget = (profile.idealPH.min + profile.idealPH.max) / 2
  const humidityTarget = profile.key === 'rice' ? 72 : 60
  const rainfallImpact = scoreClimate(scenario.rainfall, rainTarget, Math.max(profile.idealRain.max - profile.idealRain.min, 1))
  const temperatureImpact = scoreClimate(scenario.temperature, tempTarget, Math.max(profile.idealTemp.max - profile.idealTemp.min, 1))
  const humidityImpact = scoreClimate(scenario.humidity, humidityTarget, 25)
  const soilTypeImpact = profile.idealSoil.includes(String(scenario.soilType).toLowerCase()) ? 100 : 70
  const phImpact = scoreClimate(scenario.soilPh, phTarget, 2.5)
  const overall = Math.round(rainfallImpact * 0.28 + temperatureImpact * 0.24 + humidityImpact * 0.18 + soilTypeImpact * 0.15 + phImpact * 0.15)
  const day = clamp(Number(options.day ?? scenario.days ?? profile.daysToHarvest), 1, profile.daysToHarvest)
  const stageProgress = clamp(Math.round((day / profile.daysToHarvest) * 100), 0, 100)
  const stage = stageProgress < 25 ? 'Germination' : stageProgress < 55 ? 'Vegetative' : stageProgress < 85 ? 'Flowering' : 'Harvest'
  const stressFactor = clamp(0.4 + (overall / 100) * 0.6, 0.25, 1.15)
  const expectedYieldPerAcre = Number((profile.baseYieldPerAcre * stressFactor).toFixed(2))
  const expectedYieldTons = Number((expectedYieldPerAcre * scenario.areaAcres).toFixed(2))
  const grossRevenue = Math.round(expectedYieldTons * profile.pricePerTon)
  const estimatedCost = Math.round(scenario.areaAcres * profile.pricePerTon * 0.45)
  const estimatedProfit = grossRevenue - estimatedCost
  const events = options.randomEvents ? [
    rainfallImpact < 70 ? { type: 'Drought', severity: 'medium' } : null,
    rainfallImpact > 85 ? { type: 'Flood', severity: 'medium' } : null,
    temperatureImpact < 65 ? { type: 'Heat Stress', severity: 'medium' } : null,
    humidityImpact > 85 ? { type: 'Fungal Pressure', severity: 'low' } : null,
  ].filter(Boolean) : []
  const recommendations = [
    rainfallImpact < 70 ? 'Low rainfall scenario: review irrigation availability and mulching.' : null,
    rainfallImpact > 85 ? 'High rainfall scenario: prepare drainage and watch for root disease.' : null,
    temperatureImpact < 70 ? 'Heat stress or cool stress may reduce growth.' : null,
    soilTypeImpact < 100 ? `The selected soil type is not ideal for ${profile.name}.` : null,
    phImpact < 70 ? 'Soil pH is drifting away from the ideal range.' : null,
  ].filter(Boolean)

  return {
    crop: profile.name,
    cropType: profile.key,
    optimalClimate: { rainfall: profile.idealRain, temperature: profile.idealTemp, humidity: humidityTarget },
    conditions: { rainfall: scenario.rainfall, temperature: scenario.temperature, humidity: scenario.humidity, areaAcres: scenario.areaAcres, soilType: scenario.soilType, soilPh: scenario.soilPh, days: day, tickSpeed: scenario.tickSpeed },
    impacts: { rainfall: rainfallImpact, temperature: temperatureImpact, humidity: humidityImpact, soilType: soilTypeImpact, soilPh: phImpact, overall },
    growth: { day, maxDays: profile.daysToHarvest, stage, progress: stageProgress },
    economics: { expectedYieldPerAcre, expectedYieldTons, grossRevenue, estimatedCost, estimatedProfit },
    events,
    riskLevel: overall >= 80 ? 'low' : overall >= 60 ? 'moderate' : 'high',
    recommendation: recommendations[0] || 'Scenario remains close to the crop optimum.',
    recommendations: recommendations.length > 0 ? recommendations : ['Scenario remains close to the crop optimum.'],
    health: clamp(Math.round((overall + phImpact) / 2), 0, 100),
  }
}
