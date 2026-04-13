import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import Layout from '../Layout'
import { cropSimulatorAPI } from '../../services/cropSimulatorAPI'
import {
  buildSimulationSnapshot,
  clamp,
  CROP_ICON_MAP,
  DEFAULT_SCENARIO,
  SIMULATION_EVENTS,
  SOURCE_CROP_PROFILES,
  STAGE_LABELS,
  normalizeCropKey,
} from './cropSimulatorData'
import './cropSimulator.css'

const createPlantGrid = () => Array.from({ length: 24 }, (_, id) => ({ id, growth: 0 }))
const formatRupees = (value) => (value == null ? '--' : new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value))
const randomEvent = () => SIMULATION_EVENTS[Math.floor(Math.random() * SIMULATION_EVENTS.length)]
const getStageFromDay = (day, maxDays) => {
  const pct = day / maxDays
  if (pct < 0.25) return 'Germination'
  if (pct < 0.6) return 'Vegetative'
  if (pct < 0.9) return 'Flowering'
  return 'Harvest'
}

const CropSimulatorFeature = () => {
  const [scenario, setScenario] = useState({ ...DEFAULT_SCENARIO })
  const [selectedCrop, setSelectedCrop] = useState('wheat')
  const [cropOptions, setCropOptions] = useState(Object.values(SOURCE_CROP_PROFILES))
  const [simulation, setSimulation] = useState(() =>
    buildSimulationSnapshot('wheat', { ...DEFAULT_SCENARIO, days: 1 }, { day: 1, randomEvents: DEFAULT_SCENARIO.randomEvents })
  )
  const [running, setRunning] = useState(false)
  const [controlsLocked, setControlsLocked] = useState(false)
  const [weather, setWeather] = useState('normal')
  const [activeEvent, setActiveEvent] = useState(null)
  const [popup, setPopup] = useState(null)
  const [backendStatus, setBackendStatus] = useState('local')
  const [plants, setPlants] = useState(createPlantGrid())

  const intervalRef = useRef(null)
  const popupTimerRef = useRef(null)
  const activeEventRef = useRef(null)
  const activeEventDaysRef = useRef(0)
  const weatherRef = useRef('normal')

  const selectedProfile = useMemo(() => SOURCE_CROP_PROFILES[selectedCrop] || SOURCE_CROP_PROFILES.wheat, [selectedCrop])
  const stageIndex = Math.max(0, STAGE_LABELS.indexOf(simulation.growth?.stage || 'Germination'))

  const showPopup = (title, desc, icon, color) => {
    setPopup({ title, desc, icon, color })
    window.clearTimeout(popupTimerRef.current)
    popupTimerRef.current = window.setTimeout(() => setPopup(null), 3500)
  }

  const clearIntervalTimer = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const setWeatherState = (nextWeather) => {
    weatherRef.current = nextWeather
    setWeather(nextWeather)
  }

  const clearActiveEvent = () => {
    activeEventRef.current = null
    activeEventDaysRef.current = 0
    setActiveEvent(null)
    setWeatherState('normal')
  }

  const evaluateBaseHealth = (snapshot) => {
    const profile = SOURCE_CROP_PROFILES[selectedCrop] || SOURCE_CROP_PROFILES.wheat
    let penalty = 0
    if (snapshot.temperature < profile.idealTemp.min || snapshot.temperature > profile.idealTemp.max) penalty += 10
    if (snapshot.rainfall < profile.idealRain.min || snapshot.rainfall > profile.idealRain.max) penalty += 15
    if (snapshot.soilPh < profile.idealPH.min || snapshot.soilPh > profile.idealPH.max) penalty += 10
    if (!profile.idealSoil.includes(String(snapshot.soilType).toLowerCase())) penalty += 10
    return clamp(100 - penalty, 0, 100)
  }

  const syncBackendSnapshot = async (snapshot) => {
    try {
      const response = await cropSimulatorAPI.runSimulation({
        cropType: selectedCrop,
        rainfall: snapshot.rainfall,
        temperature: snapshot.temperature,
        humidity: snapshot.humidity,
        areaAcres: snapshot.areaAcres,
        soilType: snapshot.soilType,
        soilPh: snapshot.soilPh,
        randomEvents: snapshot.randomEvents,
        tickSpeed: snapshot.tickSpeed,
        simulationDays: selectedProfile.daysToHarvest,
      })
      const remote = response.data?.data?.simulation || response.data?.simulation || response.data?.data
      if (response.data?.success && remote) {
        setBackendStatus('synced')
        return remote
      }
    } catch (error) {
      setBackendStatus('fallback')
    }
    return null
  }

  useEffect(() => {
    const loadCrops = async () => {
      try {
        const response = await cropSimulatorAPI.getSupportedCrops()
        const crops = response.data?.data?.crops || response.data?.crops || []
        const normalized = crops
          .map((crop) => SOURCE_CROP_PROFILES[normalizeCropKey(crop.key)] || null)
          .filter(Boolean)
        if (normalized.length > 0) {
          setCropOptions(normalized)
        }
        setBackendStatus('synced')
      } catch (error) {
        toast.info('Using local crop simulator data')
      }
    }

    loadCrops()
  }, [])

  useEffect(() => {
    if (!cropOptions.some((crop) => crop.key === selectedCrop)) {
      setSelectedCrop(cropOptions[0]?.key || 'wheat')
    }
  }, [cropOptions, selectedCrop])

  useEffect(() => {
    if (running) return
    const preview = buildSimulationSnapshot(selectedCrop, { ...scenario, days: 1 }, { day: 1, randomEvents: scenario.randomEvents })
    setSimulation(preview)
  }, [selectedCrop, scenario, running])

  useEffect(() => {
    const progress = simulation.growth?.progress || 0
    setPlants((current) =>
      current.map((plant, index) => ({
        ...plant,
        growth: clamp(Math.round(progress / 25) + (index % 4), 0, 4),
      }))
    )
  }, [simulation.growth?.progress])

  useEffect(() => {
    return () => {
      clearIntervalTimer()
      window.clearTimeout(popupTimerRef.current)
    }
  }, [])

  const applyScenarioChange = (field, value) => {
    if (controlsLocked) return
    setScenario((current) => ({
      ...current,
      [field]: field === 'randomEvents' || field === 'soilType' ? value : Number(value),
    }))
  }

  const setSimulationDay = (day, nextScenario = scenario, nextEvent = activeEventRef.current) => {
    const next = buildSimulationSnapshot(selectedCrop, { ...nextScenario, days: day }, {
      day,
      randomEvents: nextScenario.randomEvents,
      activeEvent: nextEvent,
    })
    next.health = simulation.health
    next.growth.stage = getStageFromDay(day, selectedProfile.daysToHarvest)
    next.growth.progress = Math.round((day / selectedProfile.daysToHarvest) * 100)
    next.conditions.days = day
    next.weather = weatherRef.current
    return next
  }

  const finishSimulation = (snapshot, failed) => {
    clearIntervalTimer()
    setRunning(false)
    setControlsLocked(false)
    if (failed) {
      showPopup('Crop Failure', 'Your crops did not survive the conditions.', 'skull', 'var(--danger)')
    } else {
      showPopup('Harvest Complete', `You successfully harvested ${snapshot.crop}. Final yield: ${snapshot.economics.expectedYieldTons} tons.`, 'sack', 'var(--primary)')
    }
  }

  const tickSimulation = () => {
    setSimulation((current) => {
      const nextDay = (current.growth?.day || 1) + 1
      const maxDays = selectedProfile.daysToHarvest
      let nextEvent = activeEventRef.current

      if (nextEvent) {
        activeEventDaysRef.current -= 1
      }

      if (!nextEvent && scenario.randomEvents && Math.random() < 0.015) {
        const template = randomEvent()
        const duration = Math.floor(Math.random() * (template.durationRange[1] - template.durationRange[0] + 1)) + template.durationRange[0]
        nextEvent = { ...template, duration }
        activeEventRef.current = nextEvent
        activeEventDaysRef.current = duration
        setActiveEvent(nextEvent)
        setWeatherState(template.weather)
        showPopup(`ALERT: ${template.name}`, template.desc, template.icon, template.color)
      }

      const next = setSimulationDay(nextDay, scenario, nextEvent)
      const baseHealth = current.health ?? next.health
      next.health = nextEvent ? clamp(baseHealth - nextEvent.damagePerDay, 0, 100) : baseHealth

      if (nextEvent && activeEventDaysRef.current <= 0) {
        clearActiveEvent()
        showPopup('Event Passed', `The ${nextEvent.name} has ended.`, 'check', 'var(--primary)')
      }

      if (next.health <= 0) {
        window.setTimeout(() => finishSimulation(next, true), 0)
      } else if (nextDay >= maxDays) {
        window.setTimeout(() => finishSimulation(next, false), 0)
      }

      return next
    })
  }

  const startNewSimulation = async () => {
    clearIntervalTimer()
    clearActiveEvent()

    const initialScenario = { ...scenario, days: 1 }
    const initial = buildSimulationSnapshot(selectedCrop, initialScenario, { day: 1, randomEvents: scenario.randomEvents })
    initial.health = evaluateBaseHealth(initialScenario)
    initial.growth.stage = 'Germination'
    initial.growth.progress = Math.round((1 / selectedProfile.daysToHarvest) * 100)
    initial.conditions.days = 1
    initial.weather = 'normal'

    setSimulation(initial)
    setPlants(createPlantGrid())
    setControlsLocked(true)
    setRunning(true)
    setWeatherState('normal')

    void syncBackendSnapshot(initialScenario)
    intervalRef.current = window.setInterval(tickSimulation, 1000 / clamp(Number(scenario.tickSpeed) || 1, 1, 14))
  }

  const resumeSimulation = () => {
    setControlsLocked(true)
    setRunning(true)
    intervalRef.current = window.setInterval(tickSimulation, 1000 / clamp(Number(scenario.tickSpeed) || 1, 1, 14))
  }

  const pauseSimulation = () => {
    clearIntervalTimer()
    setRunning(false)
    setControlsLocked(false)
  }

  const toggleSimulation = () => {
    if (running) {
      pauseSimulation()
      return
    }
    if (!simulation.growth?.day || simulation.growth.day >= selectedProfile.daysToHarvest) {
      void startNewSimulation()
    } else {
      resumeSimulation()
    }
  }

  const resetSimulation = () => {
    pauseSimulation()
    clearActiveEvent()
    setScenario({ ...DEFAULT_SCENARIO })
    setSelectedCrop('wheat')
    setBackendStatus('local')
    setPlants(createPlantGrid())
    setSimulation(buildSimulationSnapshot('wheat', { ...DEFAULT_SCENARIO, days: 1 }, { day: 1, randomEvents: DEFAULT_SCENARIO.randomEvents }))
    setWeatherState('normal')
    setPopup(null)
  }

  const previewCropName = simulation.crop || selectedProfile.name
  const stageProgress = simulation.growth?.progress || 0

  return (
    <Layout showSidebar>
      <div className="crop-sim">
        <div className="crop-sim__header glass-panel">
          <div>
            <p className="crop-sim__eyebrow">Smart Tools</p>
            <h1>Crop Simulator</h1>
            <p>Simulate rainfall, temperature, humidity, soil type, soil pH, and farm size against a crop profile to see growth stage, health, and economics in one place.</p>
          </div>
        <div className={`crop-sim__status crop-sim__status--${backendStatus}`}>{backendStatus === 'synced' ? 'Backend synced' : backendStatus === 'fallback' ? 'Local fallback' : 'Local mode'}</div>
        </div>

        <div className="crop-sim__workspace">
          <aside className={`crop-sim__sidebar glass-panel ${controlsLocked ? 'is-locked' : ''}`}>
            <section className="crop-sim__section">
              <h2>Land Details</h2>
              <label>
                Area (Acres)
                <input type="number" min="1" max="1000" value={scenario.areaAcres} onChange={(e) => applyScenarioChange('areaAcres', e.target.value)} disabled={controlsLocked} />
              </label>
              <label>
                Soil Type
                <select value={scenario.soilType} onChange={(e) => applyScenarioChange('soilType', e.target.value)} disabled={controlsLocked}>
                  <option value="loamy">Loamy</option>
                  <option value="clay">Clay</option>
                  <option value="sandy">Sandy</option>
                  <option value="red">Red</option>
                  <option value="black">Black</option>
                </select>
              </label>
              <label>
                Soil pH: {scenario.soilPh.toFixed(1)}
                <input type="range" min="4" max="9" step="0.1" value={scenario.soilPh} onChange={(e) => applyScenarioChange('soilPh', e.target.value)} disabled={controlsLocked} />
              </label>
            </section>

            <section className="crop-sim__section">
              <h2>Crop Type</h2>
              <div className="crop-sim__crop-grid">
                {cropOptions.map((crop) => (
                  <button
                    key={crop.key}
                    type="button"
                    className={`crop-sim__crop ${selectedCrop === crop.key ? 'is-active' : ''}`}
                    onClick={() => !controlsLocked && setSelectedCrop(crop.key)}
                    disabled={controlsLocked}
                    style={{ '--crop-accent': crop.accent }}
                  >
                    <span className={`crop-sim__crop-icon crop-sim__crop-icon--${CROP_ICON_MAP[crop.key] || 'grain'}`} />
                    <span>{crop.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="crop-sim__section">
              <h2>Environment</h2>
              <label>
                Rainfall Expected (mm/month): {scenario.rainfall}
                <input type="range" min="0" max="300" step="10" value={scenario.rainfall} onChange={(e) => applyScenarioChange('rainfall', e.target.value)} disabled={controlsLocked} />
              </label>
              <label>
                Average Temp (°C): {scenario.temperature}
                <input type="range" min="-5" max="45" step="1" value={scenario.temperature} onChange={(e) => applyScenarioChange('temperature', e.target.value)} disabled={controlsLocked} />
              </label>
              <label>
                Humidity (%): {scenario.humidity}
                <input type="range" min="0" max="100" step="1" value={scenario.humidity} onChange={(e) => applyScenarioChange('humidity', e.target.value)} disabled={controlsLocked} />
              </label>
            </section>

            <section className="crop-sim__section">
              <h2>Simulation Controls</h2>
              <label className="crop-sim__toggle">
                <input type="checkbox" checked={scenario.randomEvents} onChange={(e) => applyScenarioChange('randomEvents', e.target.checked)} disabled={controlsLocked} />
                <span>Enable Random Events (Drought, Flood, Pests)</span>
              </label>
              <label>
                Tick Speed (Days/Sec): {scenario.tickSpeed}
                <input type="range" min="1" max="14" step="1" value={scenario.tickSpeed} onChange={(e) => applyScenarioChange('tickSpeed', e.target.value)} disabled={controlsLocked} />
              </label>
              <div className="crop-sim__actions">
                <button type="button" className={`crop-sim__button crop-sim__button--primary ${running ? 'is-running' : ''}`} onClick={toggleSimulation}>
                  {running ? 'Pause Simulation' : 'Start Simulation'}
                </button>
                <button type="button" className="crop-sim__button crop-sim__button--secondary" onClick={resetSimulation}>
                  Reset
                </button>
              </div>
            </section>
          </aside>

          <main className="crop-sim__main">
            <section className="crop-sim__visual glass-panel">
              <div className={`crop-sim__sky crop-sim__sky--${weather}`}>
                <div className="crop-sim__sun" />
                <div className="crop-sim__cloud crop-sim__cloud--one" />
                <div className="crop-sim__cloud crop-sim__cloud--two" />
                <div className="crop-sim__rain" aria-hidden="true">
                  {Array.from({ length: weather === 'flooded' ? 100 : weather === 'drought' ? 6 : 40 }).map((_, index) => (
                    <span key={index} className="crop-sim__drop" style={{ left: `${(index * 7) % 100}%`, animationDelay: `${(index % 8) * 0.08}s` }} />
                  ))}
                </div>
              </div>

              <div className={`crop-sim__ground crop-sim__ground--${weather}`}>
                <div className="crop-sim__field">
                  {plants.map((plant) => (
                    <div key={plant.id} className={`crop-sim__cell crop-sim__cell--stage-${plant.growth}`}>
                      <span className={`crop-sim__plant crop-sim__plant--${selectedCrop} crop-sim__plant--stage-${plant.growth}`} />
                    </div>
                  ))}
                </div>
              </div>

              {popup && (
                <div className="crop-sim__popup glass-panel" style={{ '--popup-color': popup.color }}>
                  <strong>{popup.title}</strong>
                  <p>{popup.desc}</p>
                </div>
              )}

              <div className="crop-sim__overlay crop-sim__overlay--day">
                Day: <span>{simulation.growth?.day || 0}</span> / <span>{selectedProfile.daysToHarvest}</span>
              </div>
              <div className="crop-sim__overlay crop-sim__overlay--stage">
                Stage: <span>{simulation.growth?.stage || 'Not Started'}</span>
              </div>
            </section>

            <section className="crop-sim__dashboard">
              <div className="crop-sim__tracker glass-panel">
                <h2>Growth Progress</h2>
                <div className="crop-sim__progress">
                  <div className="crop-sim__progress-line" style={{ width: `${stageProgress}%` }} />
                </div>
                <div className="crop-sim__nodes">
                  {STAGE_LABELS.slice(1).map((label, index) => (
                    <div key={label} className={`crop-sim__node ${stageIndex >= index + 1 ? 'is-active' : ''}`}>
                      <span className="crop-sim__dot" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="crop-sim__stats">
                <div className="crop-sim__stat glass-panel">
                  <h3>Expected Yield</h3>
                  <strong>{simulation.economics?.expectedYieldTons != null ? `${simulation.economics.expectedYieldTons} Tons` : '--'}</strong>
                  <p>{simulation.economics?.expectedYieldPerAcre != null ? `${simulation.economics.expectedYieldPerAcre} Tons / Acre` : 'Waiting for run...'}</p>
                </div>
                <div className="crop-sim__stat glass-panel">
                  <h3>Crop Health</h3>
                  <strong>{simulation.health != null ? `${simulation.health}%` : '--'}</strong>
                  <p>{simulation.riskLevel || 'Optimal'}</p>
                </div>
                <div className="crop-sim__stat glass-panel">
                  <h3>Est. Profit</h3>
                  <strong>Rs. {formatRupees(simulation.economics?.estimatedProfit)}</strong>
                  <p>Market value view</p>
                </div>
              </div>

              <div className="crop-sim__info-grid">
                <section className="crop-sim__card glass-panel">
                  <h2>Current Conditions</h2>
                  <ul>
                    <li><strong>Crop:</strong> {simulation.crop || previewCropName}</li>
                    <li><strong>Area:</strong> {simulation.conditions?.areaAcres ?? scenario.areaAcres} acres</li>
                    <li><strong>Rainfall:</strong> {simulation.conditions?.rainfall ?? scenario.rainfall} mm/month</li>
                    <li><strong>Temperature:</strong> {simulation.conditions?.temperature ?? scenario.temperature} °C</li>
                    <li><strong>Humidity:</strong> {simulation.conditions?.humidity ?? scenario.humidity}%</li>
                    <li><strong>Soil:</strong> {simulation.conditions?.soilType ?? scenario.soilType}</li>
                    <li><strong>Soil pH:</strong> {Number.isFinite(simulation.conditions?.soilPh) ? simulation.conditions.soilPh : scenario.soilPh}</li>
                    <li><strong>Weather:</strong> {weather}</li>
                  </ul>
                </section>

                <section className="crop-sim__card glass-panel">
                  <h2>Impact Assessment</h2>
                  <ul>
                    <li>Rainfall Impact: {simulation.impacts?.rainfall ?? '--'}%</li>
                    <li>Temperature Impact: {simulation.impacts?.temperature ?? '--'}%</li>
                    <li>Humidity Impact: {simulation.impacts?.humidity ?? '--'}%</li>
                    <li>Soil Type Impact: {simulation.impacts?.soilType ?? '--'}%</li>
                    <li>Soil pH Impact: {simulation.impacts?.soilPh ?? '--'}%</li>
                    <li><strong>Overall:</strong> {simulation.impacts?.overall ?? '--'}%</li>
                    <li><strong>Risk:</strong> {simulation.riskLevel || '--'}</li>
                  </ul>
                </section>
              </div>

              <div className="crop-sim__info-grid">
                <section className="crop-sim__card glass-panel">
                  <h2>Economics</h2>
                  <ul>
                    <li><strong>Gross Revenue:</strong> Rs. {formatRupees(simulation.economics?.grossRevenue)}</li>
                    <li><strong>Estimated Cost:</strong> Rs. {formatRupees(simulation.economics?.estimatedCost)}</li>
                    <li><strong>Estimated Profit:</strong> Rs. {formatRupees(simulation.economics?.estimatedProfit)}</li>
                  </ul>
                </section>

                <section className="crop-sim__card glass-panel">
                  <h2>Simulation Events</h2>
                  {simulation.events?.length ? (
                    <ul className="crop-sim__events">
                      {simulation.events.map((event, index) => (
                        <li key={`${event.type}-${index}`} className="crop-sim__event">
                          <strong>{event.type}</strong>
                          <span>{event.severity}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No major random events reported for this scenario.</p>
                  )}
                </section>
              </div>

              <section className="crop-sim__card glass-panel">
                <h2>Recommendations</h2>
                <ul className="crop-sim__bullets">
                  {(simulation.recommendations || []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </section>
          </main>
        </div>
      </div>
    </Layout>
  )
}

export default CropSimulatorFeature
