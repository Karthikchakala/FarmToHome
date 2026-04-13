import { useRef, useState } from 'react'
import { toast } from 'react-toastify'
import Layout from '../components/Layout'
import agriToolsAPI from '../services/agriToolsAPI'
import './pest-scanner.css'

const PestScanner = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (event) => setImagePreview(event.target.result);
    reader.readAsDataURL(file);
    setResult(null);
  };

  const handleScan = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    setLoading(true);
    try {
      console.log('Submitting pest scan', {
        fileName: selectedImage?.name,
        fileSize: selectedImage?.size,
        fileType: selectedImage?.type
      });
      const response = await agriToolsAPI.scanPest(selectedImage);
      console.log('Pest scan response', response.data);
      if (response.data.success) {
        setResult(response.data.data);
        toast.success('Scan completed successfully');
      } else {
        toast.error(response.data.message || 'Scan failed');
      }
    } catch (error) {
      console.error('Pest scan request failed', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error during scan'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const primaryCondition = result?.conditions?.[0]

  const scanSummary = result
    ? [
        { label: 'Plant', value: result.plantName || '--' },
        { label: 'Confidence', value: `${Math.round((result.probability || 0) * 100)}%` },
        { label: 'Health', value: result.healthScore?.status || '--' },
      ]
    : []

  const healthStatus = (result?.healthScore?.status || '').toLowerCase()
  const healthTone = healthStatus.includes('bad') || healthStatus.includes('high') || healthStatus.includes('infect')
    ? 'danger'
    : healthStatus.includes('warn') || healthStatus.includes('medium')
      ? 'warning'
      : 'good'

  return (
    <Layout showSidebar>
      <div className="pest-scanner">
        <section className="pest-scanner__hero">
          <div className="pest-scanner__eyebrow">
            <span className="pest-scanner__eyebrow-icon">🌿</span>
            Smart Tools
          </div>
          <div className="pest-scanner__hero-grid">
            <div>
              <h1>Pest & Disease Scanner</h1>
              <p>
                Upload a clear crop image and get a fast health assessment before harvest, storage, or listing.
              </p>
              <div className="pest-scanner__hero-chips">
                <span>Crop health insights</span>
                <span>AI-assisted detection</span>
                <span>Fast scan workflow</span>
              </div>
            </div>
            <div className="pest-scanner__hero-note">
              <span>AI-assisted scan</span>
              <strong>Premium crop health check</strong>
              <p>Clean workflow for quick detection, diagnosis, and treatment guidance.</p>
            </div>
          </div>
        </section>

        <div className="pest-scanner__layout">
          <section className="pest-scanner__panel pest-scanner__upload-panel">
            <div className="pest-scanner__panel-head">
              <div>
                <h2>Upload Plant Image</h2>
                <p>Use a sharp, well-lit image for the best scan quality.</p>
              </div>
              {selectedImage && (
                <button type="button" className="pest-scanner__ghost-button" onClick={resetScanner}>
                  Clear
                </button>
              )}
            </div>

            <div className={`pest-scanner__dropzone ${selectedImage ? 'is-filled' : ''}`}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="pest-scanner__file-input"
              />
              <div className="pest-scanner__dropzone-copy">
                <div className="pest-scanner__dropzone-icon">
                  <span>⬆</span>
                </div>
                <div>
                  <strong>{selectedImage ? selectedImage.name : 'Upload or drag crop image'}</strong>
                  <p>{selectedImage ? 'Image selected and ready for scan.' : 'JPG, PNG, or WEBP. Clear close-up images work best.'}</p>
                </div>
              </div>
              <div className="pest-scanner__dropzone-actions">
                <button type="button" className="pest-scanner__secondary-button" onClick={() => fileInputRef.current?.click()}>
                  Browse Files
                </button>
                <button
                  type="button"
                  className="pest-scanner__primary-button"
                  onClick={handleScan}
                  disabled={!selectedImage || loading}
                >
                  {loading ? 'Scanning...' : 'Scan Image'}
                </button>
              </div>
            </div>

            {imagePreview && (
              <div className="pest-scanner__preview">
                <div className="pest-scanner__preview-label">Preview</div>
                <img src={imagePreview} alt="Selected plant" className="pest-scanner__preview-image" />
              </div>
            )}
          </section>

          <aside className="pest-scanner__side">
            <section className="pest-scanner__panel pest-scanner__tips-panel">
              <h2>Scanning Tips</h2>
              <ul className="pest-scanner__tips">
                <li>Keep the leaf or fruit centered and in focus.</li>
                <li>Avoid shadows, blur, and heavy background clutter.</li>
                <li>Capture the affected area as close as possible.</li>
              </ul>
            </section>

            <section className="pest-scanner__panel pest-scanner__status-panel">
              <h2>Status</h2>
              <p>{selectedImage ? 'Ready to scan the selected image.' : 'No image selected yet.'}</p>
            </section>
          </aside>
        </div>

        {result && (
          <section className="pest-scanner__results">
              <div className="pest-scanner__results-head">
                <div>
                  <h2>Scan Results</h2>
                  <p>Key findings from the latest health check.</p>
                </div>
                <div className={`pest-scanner__status-badge pest-scanner__status-badge--${healthTone}`}>
                  {result.healthScore?.status || 'Pending'}
                </div>
              </div>

            <div className="pest-scanner__summary-grid">
              {scanSummary.map((item) => (
                <article key={item.label} className="pest-scanner__summary-card">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </article>
              ))}
            </div>

            <div className="pest-scanner__results-grid">
              <article className="pest-scanner__result-card">
                <div className="pest-scanner__result-title">
                  <h3>Plant Identification</h3>
                </div>
                <dl className="pest-scanner__facts">
                  <div>
                    <dt>Name</dt>
                    <dd>{result.plantName}</dd>
                  </div>
                  <div>
                    <dt>Confidence</dt>
                    <dd>{Math.round((result.probability || 0) * 100)}%</dd>
                  </div>
                </dl>
              </article>

              <article className="pest-scanner__result-card">
                <div className="pest-scanner__result-title">
                  <h3>Health Summary</h3>
                </div>
                <dl className="pest-scanner__facts">
                  <div>
                    <dt>Status</dt>
                    <dd>{result.healthScore?.status}</dd>
                  </div>
                  <div>
                    <dt>Healthy Probability</dt>
                    <dd>{Math.round((result.isHealthyProbability || 0) * 100)}%</dd>
                  </div>
                </dl>
              </article>
            </div>

              <article className="pest-scanner__result-card pest-scanner__score-card">
              <div className="pest-scanner__result-title">
                <h3>Health Score</h3>
                <span>{result.healthScore?.score}%</span>
              </div>
              <div className="pest-scanner__progress">
                <div className="pest-scanner__progress-track">
                  <div className="pest-scanner__progress-fill" style={{ width: `${result.healthScore?.score || 0}%` }} />
                </div>
                <p>{result.healthScore?.status}</p>
              </div>
            </article>

            {primaryCondition && (
              <article className="pest-scanner__result-card pest-scanner__condition-card">
                <div className="pest-scanner__result-title">
                  <h3>Primary Condition</h3>
                </div>
                <div className="pest-scanner__condition-body">
                  <div>
                    <span className="pest-scanner__label">Name</span>
                    <strong>{primaryCondition.name}</strong>
                  </div>
                  {primaryCondition.description && <p>{primaryCondition.description}</p>}
                  {primaryCondition.treatment?.biological?.length > 0 && (
                    <div className="pest-scanner__treatment">
                      <span className="pest-scanner__label">Recommended Treatment</span>
                      <ul>
                        {primaryCondition.treatment.biological.map((item) => (
                          <li key={item}>
                            <span>✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </article>
            )}
          </section>
        )}
      </div>
    </Layout>
  )
}

export default PestScanner
