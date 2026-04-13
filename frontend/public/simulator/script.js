// --- Crop Profiles & Rules ---
const CROP_PROFILES = {
    wheat: {
        name: "Wheat",
        daysToHarvest: 120,
        idealTemp: { min: 15, max: 25 },
        idealRain: { min: 40, max: 80 },
        idealPH: { min: 6.0, max: 7.0 },
        idealSoil: ['loamy', 'clay'],
        baseYieldPerAcre: 2.5, // tons
        pricePerTon: 250
    },
    corn: {
        name: "Corn",
        daysToHarvest: 90,
        idealTemp: { min: 20, max: 30 },
        idealRain: { min: 60, max: 120 },
        idealPH: { min: 5.8, max: 7.0 },
        idealSoil: ['loamy'],
        baseYieldPerAcre: 4.0,
        pricePerTon: 180
    },
    rice: {
        name: "Rice",
        daysToHarvest: 140,
        idealTemp: { min: 22, max: 32 },
        idealRain: { min: 150, max: 300 },
        idealPH: { min: 5.5, max: 6.5 },
        idealSoil: ['clay', 'loamy'],
        baseYieldPerAcre: 3.5,
        pricePerTon: 320
    },
    tomato: {
        name: "Tomato",
        daysToHarvest: 80,
        idealTemp: { min: 20, max: 28 },
        idealRain: { min: 40, max: 90 },
        idealPH: { min: 6.0, max: 6.8 },
        idealSoil: ['loamy', 'sandy'],
        baseYieldPerAcre: 5.0,
        pricePerTon: 800
    },
    sugarcane: {
        name: "Sugarcane",
        daysToHarvest: 360,
        idealTemp: { min: 25, max: 35 },
        idealRain: { min: 150, max: 250 },
        idealPH: { min: 6.0, max: 7.5 },
        idealSoil: ['loamy', 'clay'],
        baseYieldPerAcre: 30.0,
        pricePerTon: 40
    }
};

// --- SIMULATION STATE ---
let state = {
    isRunning: false,
    currentDay: 0,
    maxDays: 120,
    speed: 1, // days per real second
    crop: 'wheat',
    health: 100, // percentage
    stage: 0, // 0: none, 1: germination, 2: veg, 3: flower, 4: harvest
    simInterval: null,
    weather: 'normal', // normal, raining, drought, flooded
    activeEvent: null,
    yieldMultiplier: 1.0, 
    farmParams: {}
};

// --- DOM ELEMENTS ---
const inputs = {
    area: document.getElementById('land-area'),
    soilType: document.getElementById('soil-type'),
    ph: document.getElementById('soil-ph'),
    rain: document.getElementById('env-rain'),
    temp: document.getElementById('env-temp'),
    humidity: document.getElementById('env-humidity'),
    speed: document.getElementById('sim-speed'),
    randomEvents: document.getElementById('random-events')
};
const displays = {
    phVal: document.getElementById('ph-val'),
    rainVal: document.getElementById('rain-val'),
    tempVal: document.getElementById('temp-val'),
    humidityVal: document.getElementById('humidity-val'),
    speedVal: document.getElementById('speed-val'),
    
    currentDay: document.getElementById('current-day'),
    maxDays: document.getElementById('max-days'),
    stageText: document.getElementById('current-stage-text'),
    
    yield: document.getElementById('stat-yield'),
    health: document.getElementById('stat-health'),
    profit: document.getElementById('stat-profit'),
    
    yieldTrend: document.getElementById('yield-trend'),
    healthTrend: document.getElementById('health-trend'),
    profitTrend: document.getElementById('profit-trend')
};

const controls = {
    cropBtns: document.querySelectorAll('.crop-option'),
    startBtn: document.getElementById('start-btn'),
    resetBtn: document.getElementById('reset-btn')
};

const visualLayers = {
    sky: document.getElementById('sky-layer'),
    ground: document.getElementById('ground-layer'),
    rainContainer: document.getElementById('rain-container'),
    farmGrid: document.getElementById('farm-grid'),
    popup: document.getElementById('event-popup'),
    popupIcon: document.getElementById('event-icon'),
    popupTitle: document.getElementById('event-title'),
    popupDesc: document.getElementById('event-desc')
};

function formatCurrencyINR(value) {
    return 'Rs. ' + Number(value || 0).toLocaleString('en-IN');
}

// --- INIT & EVENT LISTENERS ---
function init() {
    // Bind slider updates
    inputs.ph.addEventListener('input', (e) => displays.phVal.innerText = e.target.value);
    inputs.rain.addEventListener('input', (e) => displays.rainVal.innerText = e.target.value + ' mm');
    inputs.temp.addEventListener('input', (e) => displays.tempVal.innerText = e.target.value + ' °C');
    inputs.humidity.addEventListener('input', (e) => displays.humidityVal.innerText = e.target.value + '%');
    
    inputs.speed.addEventListener('input', (e) => {
        state.speed = parseInt(e.target.value);
        displays.speedVal.innerText = state.speed + ' day/s';
        if(state.isRunning) {
            pauseSim();
            resumeSim();
        }
    });

    // Crop Selection
    controls.cropBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(state.isRunning) return; // Prevent change mid sim
            controls.cropBtns.forEach(b => b.classList.remove('active'));
            let target = e.currentTarget;
            target.classList.add('active');
            state.crop = target.dataset.crop;
            displays.maxDays.innerText = CROP_PROFILES[state.crop].daysToHarvest;
        });
    });

    controls.startBtn.addEventListener('click', (e) => {
        console.log('Start button clicked!');
        toggleSim();
    });
    controls.resetBtn.addEventListener('click', (e) => {
        console.log('Reset button clicked!');
        resetSim();
    });

    // Initial farm grid setup
    drawFarmGrid();

    // Dynamically insert progress bar CSS var handle
    document.querySelector('.progress-bar-container').insertAdjacentHTML('afterbegin', '<style id="progress-style">.progress-line::after { width: 0%; }</style>');
}

function gatherParams() {
    return {
        area: parseFloat(inputs.area.value) || 50,
        soilType: inputs.soilType.value,
        ph: parseFloat(inputs.ph.value),
        rain: parseFloat(inputs.rain.value),
        temp: parseFloat(inputs.temp.value),
        humidity: parseFloat(inputs.humidity.value),
        eventsEnabled: inputs.randomEvents.checked
    };
}

// --- SIMULATION ENGINE ---

function toggleSim() {
    console.log('toggleSim called. isRunning:', state.isRunning, 'currentDay:', state.currentDay, 'maxDays:', state.maxDays);
    if(!state.isRunning) {
        if(state.currentDay === 0 || state.currentDay >= state.maxDays) {
            console.log('Calling startNewSim()...');
            startNewSim();
        } else {
            console.log('Calling resumeSim()...');
            resumeSim();
        }
    } else {
        console.log('Calling pauseSim()...');
        pauseSim();
    }
}

function startNewSim() {
    console.log('startNewSim started.');
    try {
        state.farmParams = gatherParams();
        console.log('Params gathered:', state.farmParams);
        state.maxDays = CROP_PROFILES[state.crop].daysToHarvest;
    state.currentDay = 1;
    state.health = 100;
    state.yieldMultiplier = 1.0;
    state.stage = 1;
    state.activeEvent = null;
    
    displays.maxDays.innerText = state.maxDays;
    controls.startBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    controls.startBtn.classList.replace('primary', 'danger');
    controls.resetBtn.disabled = false;
    
    // Lock inputs
    document.querySelectorAll('.controls-sidebar input, .controls-sidebar select').forEach(el => {
        if(el.id !== 'sim-speed') el.disabled = true;
    });

    evaluateBaseHealth();
    
    drawFarmGrid(); // resets visually
    updateStageVisuals();
    
    resumeSim();
    } catch(err) {
        console.error('Error in startNewSim:', err);
    }
}

function resumeSim() {
    state.isRunning = true;
    controls.startBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    controls.startBtn.classList.replace('primary', 'danger');

    // Calculate real ms per interval.
    // E.g., speed=2 days/sec means ~500ms per interval (1 day per interval).
    const msPerSimDay = 1000 / state.speed;

    state.simInterval = setInterval(() => {
        advanceDay();
    }, msPerSimDay);
}

function pauseSim() {
    state.isRunning = false;
    clearInterval(state.simInterval);
    controls.startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Resume';
    controls.startBtn.classList.replace('danger', 'primary');
}

function resetSim() {
    pauseSim();
    state.currentDay = 0;
    state.health = 100;
    state.stage = 0;
    state.activeEvent = null;
    state.yieldMultiplier = 1;
    clearWeather();
    
    displays.currentDay.innerText = '0';
    displays.health.innerText = '100%';
    displays.yield.innerText = '-- Tons';
    displays.profit.innerText = 'Rs. 0';
    displays.stageText.innerText = 'Not Started';
    displays.healthTrend.innerText = 'Optimal';
    displays.healthTrend.className = 'trend';
    
    document.getElementById('progress-style').innerHTML = `.progress-line::after { width: 0%; }`;
    document.querySelectorAll('.node').forEach(n => n.classList.remove('active'));

    controls.startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start Simulation';
    controls.startBtn.classList.replace('danger', 'primary');
    controls.resetBtn.disabled = true;

    // Unlock inputs
    document.querySelectorAll('.controls-sidebar input, .controls-sidebar select').forEach(el => el.disabled = false);

    drawFarmGrid();
}

// Determines starting health penalty if config is way off ideal
function evaluateBaseHealth() {
    let profile = CROP_PROFILES[state.crop];
    let p = state.farmParams;
    let penalty = 0;

    if(p.temp < profile.idealTemp.min || p.temp > profile.idealTemp.max) penalty += 10;
    if(p.rain < profile.idealRain.min || p.rain > profile.idealRain.max) penalty += 15;
    if(p.ph < profile.idealPH.min || p.ph > profile.idealPH.max) penalty += 10;
    if(!profile.idealSoil.includes(p.soilType)) penalty += 10;

    state.health -= penalty;
    if(state.health < 0) state.health = 0;
    
    displays.health.innerText = Math.round(state.health) + '%';
    displays.healthTrend.innerText = penalty > 0 ? 'Suboptimal conditions' : 'Optimal conditions';
    displays.healthTrend.classList.add(penalty > 0 ? 'down' : 'up');
}

function advanceDay() {
    state.currentDay++;
    displays.currentDay.innerText = state.currentDay;

    // Phase checks
    let pct = state.currentDay / state.maxDays;
    let oldStage = state.stage;
    
    if(pct < 0.25) state.stage = 1;      // Germination
    else if(pct < 0.6) state.stage = 2;  // Vegetative
    else if(pct < 0.9) state.stage = 3;  // Flowering
    else state.stage = 4;                // Harvest

    if(oldStage !== state.stage) {
        updateStageVisuals();
    }

    document.getElementById('progress-style').innerHTML = `.progress-line::after { width: ${pct*100}%; }`;

    // Visual Weather simulation loop
    handleWeatherVisuals();

    // Random Events (1% chance per day if enabled, and no active event)
    if(state.farmParams.eventsEnabled && !state.activeEvent && Math.random() < 0.015) {
        triggerRandomEvent();
    }

    // Resolve event duration
    if(state.activeEvent) {
        state.activeEvent.duration--;
        state.health -= state.activeEvent.damagePerDay;
        if(state.health < 0) state.health = 0;
        displays.health.innerText = Math.round(state.health) + '%';
        displays.healthTrend.innerText = state.activeEvent.name + ' Active!';
        displays.healthTrend.className = 'trend down';
        
        if(state.activeEvent.duration <= 0) {
            resolveEvent();
        }
    }

    calculateYieldPreview();

    if(state.currentDay >= state.maxDays || state.health <= 0) {
        endSim();
    }
}

function calculateYieldPreview() {
    let profile = CROP_PROFILES[state.crop];
    let area = state.farmParams.area;
    // Base Yield = area * base/acre * (health/100) * yieldMultiplier
    let estYield = area * profile.baseYieldPerAcre * (state.health / 100) * state.yieldMultiplier;
    let estProfit = Math.round(estYield * profile.pricePerTon);

    displays.yield.innerText = estYield.toFixed(1) + ' Tons';
    displays.profit.innerText = formatCurrencyINR(estProfit);
}

function endSim() {
    pauseSim();
    controls.startBtn.disabled = true; // wait for reset
    
    if(state.health <= 0) {
         displays.stageText.innerText = 'CROP FAILED';
         document.querySelectorAll('.plant').forEach(p => {
             p.className = 'plant crop-' + state.crop + ' dead';
         });
         showPopup('Crop Failure', 'Your crops did not survive the conditions.', 'fa-skull', 'var(--accent-danger)');
    } else {
         displays.stageText.innerText = 'HARVEST READY';
         displays.stageText.parentElement.style.background = 'rgba(16, 185, 129, 0.2)';
         
         let yieldStr = displays.yield.innerText;
         let profitStr = displays.profit.innerText;
            showPopup('Harvest Complete!', 
            `<div style="text-align:center;">You successfully harvested <b>${CROP_PROFILES[state.crop].name}</b>!<br><br>
            <span style="font-size:1.1rem;color:var(--text-muted)">Final Yield: <strong style="color:var(--text-main)">${yieldStr}</strong></span><br>
            <span style="font-size:1.4rem;color:var(--primary);font-weight:bold;">Gross Revenue: ${profitStr}</span></div>`, 
            'fa-indian-rupee-sign', 'var(--primary)');
    }
    clearWeather();
}

// --- VISUAL RENDERING ---

function drawFarmGrid() {
    visualLayers.farmGrid.innerHTML = '';
    // Draw 24 plants
    for(let i=0; i<24; i++) {
        let cell = document.createElement('div');
        cell.className = 'plant-cell';
        let plant = document.createElement('div');
        plant.className = 'plant';
        cell.appendChild(plant);
        visualLayers.farmGrid.appendChild(cell);
    }
}

function updateStageVisuals() {
    let stageNames = ['', 'Germination', 'Vegetative', 'Flowering', 'Harvest'];
    displays.stageText.innerText = stageNames[state.stage];

    // Update nodes
    document.querySelectorAll('.node').forEach(n => n.classList.remove('active'));
    if(state.stage >= 1) document.getElementById('node-germination').classList.add('active');
    if(state.stage >= 2) document.getElementById('node-vegetative').classList.add('active');
    if(state.stage >= 3) document.getElementById('node-flowering').classList.add('active');
    if(state.stage >= 4) document.getElementById('node-harvest').classList.add('active');

    // Update 3D plants
    document.querySelectorAll('.plant').forEach((p, index) => {
        // smooth organic stagger
        setTimeout(() => {
            p.className = 'plant crop-' + state.crop + ' stage-' + state.stage;
        }, Math.random() * 800 + (index * 10)); // random stagger look for organic growth
    });
}

// --- WEATHER & EVENTS ---

function handleWeatherVisuals() {
    let p = state.farmParams;
    let expectedRain = p.rain; // 0 to 300 mm/mo
    
    // Normal weather cycle based on rainfall probability
    if(!state.activeEvent) {
        let rainChance = expectedRain / 300; // max 1.0
        // Determine today's weather
        let isRainingToday = Math.random() < rainChance;
        
        if(isRainingToday && state.weather !== 'raining') {
            setWeather('raining');
        } else if (!isRainingToday && state.weather !== 'normal') {
            setWeather('normal');
        }
    }
}

function setWeather(type) {
    state.weather = type;
    visualLayers.sky.className = 'sky ' + type;
    visualLayers.ground.className = 'ground ' + (type === 'flooded' ? 'flooded' : type === 'drought' ? 'drought' : '');
    
    if(type === 'raining' || type === 'flooded') {
        startRain();
    } else {
        stopRain();
    }
}
function clearWeather() {
    setWeather('normal');
}

function startRain() {
    stopRain();
    let dropCount = state.weather === 'flooded' ? 100 : 40;
    for(let i=0; i<dropCount; i++) {
        let drop = document.createElement('div');
        drop.className = 'raindrop';
        drop.style.left = Math.random() * 100 + '%';
        drop.style.animationDuration = (0.3 + Math.random() * 0.4) + 's';
        drop.style.animationDelay = Math.random() * 0.5 + 's';
        visualLayers.rainContainer.appendChild(drop);
    }
}

function stopRain() {
    visualLayers.rainContainer.innerHTML = '';
}


const EVENTS = [
    {
        id: 'drought', name: 'Severe Drought', icon: 'fa-sun', color: '#f59e0b',
        durationRange: [7, 21], // days
        damagePerDay: 1.5,
        weather: 'drought',
        desc: 'Lack of water is drying out the crops rapidly!'
    },
    {
        id: 'flood', name: 'Flash Flood', icon: 'fa-cloud-showers-water', color: '#3b82f6',
        durationRange: [3, 7],
        damagePerDay: 2.5,
        weather: 'flooded',
        desc: 'Heavy rains have flooded the fields, drowning roots.'
    },
    {
        id: 'pest', name: 'Pest Infestation', icon: 'fa-bug', color: '#84cc16',
        durationRange: [5, 14],
        damagePerDay: 1.0,
        weather: 'normal',
        desc: 'Locusts/Aphids are attacking the vegetative matter!'
    }
];

function triggerRandomEvent() {
    let evTemp = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    let duration = Math.floor(Math.random() * (evTemp.durationRange[1] - evTemp.durationRange[0])) + evTemp.durationRange[0];
    
    state.activeEvent = { ...evTemp, duration: duration };
    setWeather(evTemp.weather);
    
    showPopup('ALERT: ' + evTemp.name, evTemp.desc, evTemp.icon, evTemp.color);
}

function resolveEvent() {
    let ev = state.activeEvent;
    state.activeEvent = null;
    clearWeather();
    displays.healthTrend.innerText = 'Recovering...';
    displays.healthTrend.className = 'trend up';
    
    showPopup('Event Passed', `The ${ev.name} has ended.`, 'fa-circle-check', 'var(--primary)');
}


function showPopup(title, desc, iconCls, color) {
    visualLayers.popup.classList.remove('hidden');
    // flush dom
    void visualLayers.popup.offsetWidth;
    
    visualLayers.popupTitle.innerText = title;
    visualLayers.popupTitle.style.color = color;
    visualLayers.popupDesc.innerHTML = desc;
    visualLayers.popupIcon.className = `fa-solid ${iconCls}`;
    visualLayers.popupIcon.style.color = color;
    
    visualLayers.popup.classList.add('show');
    
    setTimeout(() => {
        visualLayers.popup.classList.remove('show');
    }, 4000); // hide after 4 seconds
}

// Bootstrap
window.addEventListener('DOMContentLoaded', init);
