import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import './Home.css'

const Home = () => {
  const videoRef = useRef(null)
  const [useFallback, setUseFallback] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined

    const handleError = () => setUseFallback(true)
    const handleReady = () => {
      video.play().catch(() => {
        setUseFallback(true)
      })
    }

    video.addEventListener('canplay', handleReady)
    video.addEventListener('error', handleError)

    const fallbackTimer = window.setTimeout(() => {
      if (video.readyState < 3) {
        setUseFallback(true)
      }
    }, 5000)

    video.play().catch(() => {
      // Autoplay can still fail on some devices; the fallback image keeps the hero usable.
    })

    return () => {
      video.removeEventListener('canplay', handleReady)
      video.removeEventListener('error', handleError)
      window.clearTimeout(fallbackTimer)
    }
  }, [])

  return (
    <>
      <SEO
        title="FarmToHome - Fresh Produce Direct from Local Farmers"
        description="FarmToHome connects you with trusted local farmers for fresh produce, seasonal ingredients, and a simpler farm-to-table experience."
        keywords="farm to home, fresh produce, local farmers, organic produce, farm to table"
      />

      <main className="home-page">
        <div className="home-hero">
          <div className="home-media" aria-hidden="true">
            {!useFallback ? (
              <video
                ref={videoRef}
                className="home-video"
                autoPlay
                muted
                loop
                playsInline
                poster="/organic.png"
              >
                <source src="/bali_rice_farm.webm" type="video/webm" />
              </video>
            ) : (
              <div className="home-fallback" style={{ backgroundImage: 'url(/organic.png)' }} />
            )}
            <div className="home-overlay" />
            <div className="home-vignette" />
          </div>

          <div className="home-copy">
            <h1 className="home-title">
              Farm to Home
              <span>Fresh, Direct, and Fair.</span>
            </h1>

            <div className="home-actions">
              <Link to="/signup" className="home-cta home-cta-primary">
                Get Started
              </Link>
              <Link to="/about" className="home-cta home-cta-secondary">
                Learn More
              </Link>
            </div>
          </div>

          <footer className="home-footer">
            <div className="home-footer-brand">
              <img src="/organic.png" alt="FarmToHome" className="home-footer-logo" />
              <span>FarmToHome</span>
            </div>
            <div className="home-footer-links">
              <Link to="/about">About</Link>
              <Link to="/services">Services</Link>
              <Link to="/contact">Contact</Link>
            </div>
            <p className="home-footer-copy">Fresh from source to doorstep.</p>
          </footer>
        </div>
      </main>
    </>
  )
}

export default Home
