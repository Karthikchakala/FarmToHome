import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import agriToolsAPI from '../services/agriToolsAPI';
import './yield-predictor.css';

const YieldPredictor = () => {
  const [formData, setFormData] = useState({
    cropType: '',
    fieldArea: '',
    rainfall: '',
    temperature: '',
    humidity: '',
    soilQuality: '5'
  });
  const [supportedCrops, setSupportedCrops] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSupportedCrops = async () => {
      try {
        const response = await agriToolsAPI.getYieldCrops();
        if (response.data.success) {
          setSupportedCrops(response.data.data.crops || []);
        }
      } catch (error) {
        toast.error('Failed to load supported crops');
      }
    };

    fetchSupportedCrops();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await agriToolsAPI.predictYield({
        cropType: formData.cropType,
        fieldArea: parseFloat(formData.fieldArea),
        rainfall: parseFloat(formData.rainfall),
        temperature: parseFloat(formData.temperature),
        humidity: parseFloat(formData.humidity || 60),
        soilQuality: parseInt(formData.soilQuality, 10)
      });

      if (response.data.success) {
        setResult(response.data.data);
        toast.success('Prediction completed');
      } else {
        toast.error(response.data.message || 'Prediction failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showSidebar>
      <div className="yield-predictor-page">
        <section className="yield-hero">
          <div className="yield-hero__copy">
            <span className="yield-badge">Precision farming intelligence</span>
            <h1>Crop Yield Predictor</h1>
            <p>
              Turn rainfall, temperature, humidity, and soil quality into a clear yield estimate
              with a polished decision-ready view for planning harvests and revenue.
            </p>

            <div className="yield-hero__stats">
              <div className="yield-stat">
                <strong>{supportedCrops.length || '--'}</strong>
                <span>Supported crops</span>
              </div>
              <div className="yield-stat">
                <strong>5 inputs</strong>
                <span>Fast climate snapshot</span>
              </div>
              <div className="yield-stat">
                <strong>Actionable</strong>
                <span>Yield + revenue outlook</span>
              </div>
            </div>
          </div>

          <div className="yield-hero__panel">
            <div className="yield-panel-card yield-panel-card--accent">
              <span className="yield-panel-card__label">Decision support</span>
              <h3>Professional planning for the next sowing cycle</h3>
              <p>
                Use the model to compare crop potential, identify climate risk, and align your
                field plan with market expectations.
              </p>
            </div>

            <div className="yield-mini-grid">
              <div className="yield-mini-card">
                <span>Yield focus</span>
                <strong>Per hectare</strong>
              </div>
              <div className="yield-mini-card">
                <span>Revenue lens</span>
                <strong>Estimated return</strong>
              </div>
              <div className="yield-mini-card">
                <span>Risk view</span>
                <strong>Confidence score</strong>
              </div>
              <div className="yield-mini-card">
                <span>Soil signal</span>
                <strong>1 to 10 scale</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="yield-dashboard">
          <div className="yield-card yield-form-card">
            <div className="yield-card__header">
              <div>
                <span className="yield-section-kicker">Field inputs</span>
                <h2>Enter crop conditions</h2>
              </div>
              <p>Built for quick, production-style estimation with clear units and useful defaults.</p>
            </div>

            <form onSubmit={handlePredict} className="yield-form">
              <div className="yield-form__grid">
                <div className="yield-field yield-field--full">
                  <label htmlFor="cropType">Crop Type</label>
                  <select
                    id="cropType"
                    name="cropType"
                    value={formData.cropType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select crop</option>
                    {supportedCrops.map((crop) => (
                      <option key={crop.key} value={crop.key}>{crop.name}</option>
                    ))}
                  </select>
                </div>

                <div className="yield-field">
                  <label htmlFor="fieldArea">Field Area</label>
                  <input
                    id="fieldArea"
                    type="number"
                    name="fieldArea"
                    value={formData.fieldArea}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0.1"
                    placeholder="e.g. 2.5"
                    required
                  />
                  <span className="yield-field__hint">Measured in hectares</span>
                </div>

                <div className="yield-field">
                  <label htmlFor="rainfall">Average Rainfall</label>
                  <input
                    id="rainfall"
                    type="number"
                    name="rainfall"
                    value={formData.rainfall}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    placeholder="e.g. 85"
                    required
                  />
                  <span className="yield-field__hint">Centimetres per month</span>
                </div>

                <div className="yield-field">
                  <label htmlFor="temperature">Average Temperature</label>
                  <input
                    id="temperature"
                    type="number"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleInputChange}
                    step="0.1"
                    placeholder="e.g. 27"
                    required
                  />
                  <span className="yield-field__hint">Degrees Celsius</span>
                </div>

                <div className="yield-field">
                  <label htmlFor="humidity">Humidity</label>
                  <input
                    id="humidity"
                    type="number"
                    name="humidity"
                    value={formData.humidity}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g. 68"
                  />
                  <span className="yield-field__hint">Percent relative humidity</span>
                </div>

                <div className="yield-field yield-field--full">
                  <div className="yield-range-head">
                    <label htmlFor="soilQuality">Soil Quality</label>
                    <span>{formData.soilQuality}/10</span>
                  </div>
                  <input
                    id="soilQuality"
                    type="range"
                    name="soilQuality"
                    value={formData.soilQuality}
                    onChange={handleInputChange}
                    min="1"
                    max="10"
                  />
                  <div className="yield-range-scale">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="yield-submit">
                {loading ? 'Predicting...' : 'Predict Yield'}
              </button>
            </form>
          </div>

          <aside className="yield-card yield-insights">
            <div className="yield-card__header">
              <div>
                <span className="yield-section-kicker">Supported crops</span>
                <h2>Quick crop reference</h2>
              </div>
              <p>Available models currently loaded from the backend service.</p>
            </div>

            <div className="yield-crop-list">
              {supportedCrops.length > 0 ? supportedCrops.map((crop) => (
                <div key={crop.key} className="yield-crop-chip">
                  <strong>{crop.name}</strong>
                  <span>{crop.key}</span>
                </div>
              )) : (
                <div className="yield-empty">Loading supported crops...</div>
              )}
            </div>

            <div className="yield-insight-box">
              <h3>Why this design works</h3>
              <p>
                The interface keeps the input path simple, uses a clear information hierarchy, and
                presents the output like a business dashboard instead of a plain form result.
              </p>
            </div>
          </aside>
        </section>

        {result && (
          <section className="yield-card yield-results">
            <div className="yield-card__header yield-card__header--results">
              <div>
                <span className="yield-section-kicker">Prediction output</span>
                <h2>Results dashboard</h2>
              </div>
              <p>Clear yield, revenue, and confidence indicators for field-level planning.</p>
            </div>

            <div className="yield-results__grid">
              <div className="yield-result-tile yield-result-tile--green">
                <span>Yield per hectare</span>
                <strong>{result.yield_per_hectare.toFixed(2)} tons</strong>
                <small>Total yield: {result.total_yield.toFixed(2)} tons</small>
              </div>

              <div className="yield-result-tile yield-result-tile--blue">
                <span>Estimated revenue</span>
                <strong>Rs {result.estimated_revenue.toLocaleString()}</strong>
                <small>Projected gross return</small>
              </div>

              <div className="yield-result-tile yield-result-tile--purple">
                <span>Model confidence</span>
                <strong>{Math.round(result.confidence * 100)}%</strong>
                <small>Prediction certainty score</small>
              </div>
            </div>

            <div className="yield-breakdown">
              <div className="yield-breakdown__title">
                <h3>Input breakdown</h3>
                <p>Signal contributions from each field factor.</p>
              </div>

              {[
                { label: 'Rainfall', value: result.breakdown?.rainfallScore ?? 0 },
                { label: 'Temperature', value: result.breakdown?.temperatureScore ?? 0 },
                { label: 'Humidity', value: result.breakdown?.humidityScore ?? 0 },
                { label: 'Soil quality', value: result.breakdown?.soilScore ?? 0 }
              ].map((item) => (
                <div key={item.label} className="yield-progress-row">
                  <div className="yield-progress-row__head">
                    <span>{item.label}</span>
                    <strong>{item.value}%</strong>
                  </div>
                  <div className="yield-progress">
                    <span style={{ width: `${Math.max(0, Math.min(100, item.value))}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {result.recommendations?.length > 0 && (
              <div className="yield-recommendations">
                <h3>Recommendations</h3>
                <div className="yield-recommendations__grid">
                  {result.recommendations.map((item) => (
                    <div key={item} className="yield-recommendation">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </Layout>
  );
};

export default YieldPredictor;
