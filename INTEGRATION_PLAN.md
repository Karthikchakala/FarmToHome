# Croporia Simulator Integration into FarmToHome

## Phase 1: Frontend Components

### 1. Create Simulator Page Component
```jsx
// frontend/src/pages/farmer/Simulator.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SimulatorControls from '../../components/simulator/SimulatorControls';
import ClimateVisualization from '../../components/simulator/ClimateVisualization';
import GrowthDashboard from '../../components/simulator/GrowthDashboard';

export default function Simulator() {
  const { user } = useAuth();
  const [simulationData, setSimulationData] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  return (
    <div className="simulator-container">
      <div className="simulator-sidebar">
        <SimulatorControls 
          onStart={handleStart}
          onStop={handleStop}
          onReset={handleReset}
        />
      </div>
      <div className="simulator-main">
        <ClimateVisualization data={simulationData} />
        <GrowthDashboard metrics={simulationData?.metrics} />
      </div>
    </div>
  );
}
```

### 2. Simulator Controls Component
```jsx
// frontend/src/components/simulator/SimulatorControls.jsx
export default function SimulatorControls({ onStart, onStop, onReset }) {
  const [landArea, setLandArea] = useState(50);
  const [soilType, setSoilType] = useState('loamy');
  const [soilPh, setSoilPh] = useState(6.5);
  const [selectedCrop, setSelectedCrop] = useState('wheat');
  const [rainfall, setRainfall] = useState(100);
  const [temperature, setTemperature] = useState(22);
  const [humidity, setHumidity] = useState(60);

  const crops = [
    { id: 'wheat', name: 'Wheat', icon: 'fa-wheat-awn' },
    { id: 'corn', name: 'Corn', icon: 'fa-pagelines' },
    { id: 'rice', name: 'Rice', icon: 'fa-bowl-rice' },
    { id: 'tomato', name: 'Tomato', icon: 'fa-apple-whole' },
    { id: 'sugarcane', name: 'Sugar Cane', icon: 'fa-tree' }
  ];

  return (
    <div className="simulator-controls">
      {/* Land Details Section */}
      <div className="control-section">
        <h3><i className="fas fa-map"></i> Land Details</h3>
        <div className="input-group">
          <label>Area (Acres)</label>
          <input 
            type="number" 
            value={landArea} 
            onChange={(e) => setLandArea(e.target.value)}
            min="1" max="1000"
          />
        </div>
        <div className="input-group">
          <label>Soil Type</label>
          <select value={soilType} onChange={(e) => setSoilType(e.target.value)}>
            <option value="loamy">Loamy (Ideal)</option>
            <option value="clay">Clay (Heavy)</option>
            <option value="sandy">Sandy (Drainage)</option>
          </select>
        </div>
        <div className="input-group">
          <label>Soil pH</label>
          <input 
            type="range" 
            min="4" max="9" step="0.5" 
            value={soilPh}
            onChange={(e) => setSoilPh(e.target.value)}
          />
          <span>{soilPh}</span>
        </div>
      </div>

      {/* Crop Selection */}
      <div className="control-section">
        <h3><i className="fas fa-seedling"></i> Crop Type</h3>
        <div className="crop-grid">
          {crops.map(crop => (
            <div 
              key={crop.id}
              className={`crop-option ${selectedCrop === crop.id ? 'active' : ''}`}
              onClick={() => setSelectedCrop(crop.id)}
            >
              <i className={`fas ${crop.icon}`}></i>
              <span>{crop.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Environment Controls */}
      <div className="control-section">
        <h3><i className="fas fa-cloud-sun-rain"></i> Environment</h3>
        <div className="input-group">
          <label>Rainfall (mm/month)</label>
          <input 
            type="range" 
            min="0" max="300" step="10" 
            value={rainfall}
            onChange={(e) => setRainfall(e.target.value)}
          />
          <span>{rainfall} mm</span>
        </div>
        <div className="input-group">
          <label>Temperature (°C)</label>
          <input 
            type="range" 
            min="-5" max="45" step="1" 
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
          />
          <span>{temperature} °C</span>
        </div>
        <div className="input-group">
          <label>Humidity (%)</label>
          <input 
            type="range" 
            min="0" max="100" step="1" 
            value={humidity}
            onChange={(e) => setHumidity(e.target.value)}
          />
          <span>{humidity}%</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="btn-primary" onClick={() => onStart({
          landArea, soilType, soilPh, selectedCrop, rainfall, temperature, humidity
        })}>
          <i className="fas fa-play"></i> Start Simulation
        </button>
        <button className="btn-secondary" onClick={onReset}>
          <i className="fas fa-redo"></i> Reset
        </button>
      </div>
    </div>
  );
}
```

## Phase 2: Backend Implementation

### 1. Simulator Controller
```javascript
// backend/controllers/simulatorController.js
const simulationEngine = require('../services/simulationEngine');

exports.startSimulation = async (req, res) => {
  try {
    const { landArea, soilType, soilPh, selectedCrop, rainfall, temperature, humidity } = req.body;
    
    const simulationConfig = {
      farmerId: req.user._id,
      land: { area: landArea, soilType, pH: soilPh },
      crop: selectedCrop,
      climate: { rainfall, temperature, humidity },
      duration: 120 // days
    };

    const simulation = await simulationEngine.start(simulationConfig);
    
    res.json({
      success: true,
      data: simulation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getSimulationResults = async (req, res) => {
  try {
    const { simulationId } = req.params;
    const results = await simulationEngine.getResults(simulationId);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

### 2. Simulation Engine Service
```javascript
// backend/services/simulationEngine.js
class SimulationEngine {
  constructor() {
    this.activeSimulations = new Map();
    this.cropProfiles = this.loadCropProfiles();
  }

  async start(config) {
    const simulationId = this.generateId();
    const simulation = {
      id: simulationId,
      config,
      currentDay: 0,
      metrics: {
        health: 100,
        growth: 0,
        yield: 0,
        profit: 0
      },
      events: [],
      startedAt: new Date()
    };

    this.activeSimulations.set(simulationId, simulation);
    this.runSimulation(simulationId);
    
    return simulation;
  }

  async runSimulation(simulationId) {
    const simulation = this.activeSimulations.get(simulationId);
    const cropProfile = this.cropProfiles[simulation.config.crop];
    
    // Simulate day by day
    const interval = setInterval(() => {
      if (simulation.currentDay >= simulation.config.duration) {
        clearInterval(interval);
        this.completeSimulation(simulationId);
        return;
      }

      this.processDay(simulation, cropProfile);
      simulation.currentDay++;
      
      // Emit real-time updates via Socket.io
      this.emitUpdate(simulation);
    }, 1000); // 1 second per day
  }

  processDay(simulation, cropProfile) {
    const { climate, land } = simulation.config;
    let healthImpact = 0;
    let growthImpact = 0;

    // Climate impact calculations
    if (climate.temperature < cropProfile.tempRange.min || climate.temperature > cropProfile.tempRange.max) {
      healthImpact -= Math.abs(climate.temperature - cropProfile.tempRange.optimal) * 0.5;
    }

    if (climate.rainfall < cropProfile.waterRange.min || climate.rainfall > cropProfile.waterRange.max) {
      healthImpact -= Math.abs(climate.rainfall - cropProfile.waterRange.optimal) * 0.1;
    }

    // Soil pH impact
    if (land.pH < cropProfile.phRange.min || land.pH > cropProfile.phRange.max) {
      healthImpact -= Math.abs(land.pH - cropProfile.phRange.optimal) * 2;
    }

    // Random events
    if (Math.random() < 0.05) { // 5% chance
      const event = this.generateRandomEvent();
      simulation.events.push(event);
      healthImpact += event.healthImpact;
    }

    // Update metrics
    simulation.metrics.health = Math.max(0, Math.min(100, simulation.metrics.health + healthImpact));
    simulation.metrics.growth = Math.min(100, simulation.metrics.growth + growthImpact);
    
    // Calculate yield based on health and growth
    const baseYield = cropProfile.baseYield * simulation.config.land.area;
    simulation.metrics.yield = baseYield * (simulation.metrics.health / 100) * (simulation.metrics.growth / 100);
    
    // Calculate profit
    const marketPrice = this.getMarketPrice(simulation.config.crop);
    simulation.metrics.profit = simulation.metrics.yield * marketPrice;
  }

  loadCropProfiles() {
    return {
      wheat: {
        tempRange: { min: 15, max: 25, optimal: 20 },
        waterRange: { min: 50, max: 150, optimal: 100 },
        phRange: { min: 6.0, max: 7.5, optimal: 6.8 },
        baseYield: 3.5, // tons per acre
        growthStages: {
          germination: 10,
          vegetative: 40,
          flowering: 80,
          harvest: 120
        }
      },
      corn: {
        tempRange: { min: 18, max: 30, optimal: 24 },
        waterRange: { min: 60, max: 180, optimal: 120 },
        phRange: { min: 5.8, max: 7.2, optimal: 6.5 },
        baseYield: 4.2,
        growthStages: {
          germination: 7,
          vegetative: 35,
          flowering: 70,
          harvest: 110
        }
      },
      rice: {
        tempRange: { min: 20, max: 35, optimal: 28 },
        waterRange: { min: 150, max: 300, optimal: 200 },
        phRange: { min: 5.5, max: 7.0, optimal: 6.2 },
        baseYield: 4.5,
        growthStages: {
          germination: 5,
          vegetative: 30,
          flowering: 65,
          harvest: 105
        }
      },
      tomato: {
        tempRange: { min: 18, max: 28, optimal: 23 },
        waterRange: { min: 40, max: 120, optimal: 80 },
        phRange: { min: 6.0, max: 7.0, optimal: 6.5 },
        baseYield: 2.8,
        growthStages: {
          germination: 8,
          vegetative: 25,
          flowering: 50,
          harvest: 85
        }
      },
      sugarcane: {
        tempRange: { min: 20, max: 35, optimal: 27 },
        waterRange: { min: 100, max: 250, optimal: 150 },
        phRange: { min: 6.0, max: 7.5, optimal: 6.8 },
        baseYield: 8.0,
        growthStages: {
          germination: 15,
          vegetative: 60,
          flowering: 120,
          harvest: 180
        }
      }
    };
  }
}

module.exports = new SimulationEngine();
```

## Phase 3: Database Integration

### Add Simulation Tables to PostgreSQL
```sql
-- Simulation Sessions
CREATE TABLE simulation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES users(_id),
  crop_type VARCHAR(50),
  land_area DECIMAL,
  soil_type VARCHAR(20),
  soil_ph DECIMAL(3,1),
  rainfall INTEGER,
  temperature INTEGER,
  humidity INTEGER,
  status VARCHAR(20) DEFAULT 'running',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Simulation Results
CREATE TABLE simulation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES simulation_sessions(id),
  day_number INTEGER,
  health_percentage DECIMAL(5,2),
  growth_percentage DECIMAL(5,2),
  yield_estimate DECIMAL(10,2),
  profit_estimate DECIMAL(10,2),
  events JSONB,
  recorded_at TIMESTAMP DEFAULT NOW()
);
```

## Phase 4: API Routes

### Add Simulator Routes
```javascript
// backend/routes/simulator.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const simulatorController = require('../controllers/simulatorController');

router.post('/start', authenticate, authorize('farmer'), simulatorController.startSimulation);
router.get('/results/:simulationId', authenticate, simulatorController.getSimulationResults);
router.get('/history', authenticate, authorize('farmer'), simulatorController.getSimulationHistory);

module.exports = router;
```

## Phase 5: Navigation Integration

### Add to FarmToHome Navigation
```jsx
// In FarmerNavbar.jsx
const farmerLinks = [
  { to: '/farmer/dashboard', l: 'Dashboard' },
  { to: '/farmer/products', l: 'My Products' },
  { to: '/farmer/orders', l: 'Orders' },
  { to: '/farmer/crop-simulator', l: 'Crop Simulator' }, // NEW
  { to: '/farmer/analytics', l: 'Analytics' },
  { to: '/farmer/profile', l: 'Profile' }
];
```

## Benefits for FarmToHome

1. **Farmer Retention**: Engaging tool keeps farmers on platform
2. **Data Collection**: Gather insights on farming conditions
3. **Product Recommendations**: Suggest products based on simulation results
4. **Premium Feature**: Could be monetized as advanced tool
5. **Competitive Advantage**: Unique feature in marketplace

## Implementation Timeline

- **Week 1**: Frontend components development
- **Week 2**: Backend simulation engine
- **Week 3**: Database integration and API routes
- **Week 4**: Testing and deployment
