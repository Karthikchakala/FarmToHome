import { useState } from 'react'
import { Link } from 'react-router-dom'
import './HeroSection.css'

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <section className="hero-section">
      <div className="hero-background">
        <div className="hero-overlay"></div>
      </div>
      
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              🌱 100% Organic • Farm Fresh • Direct Sourcing
            </div>
            
            <h1 className="hero-title">
              Fresh From Farm<br />
              <span className="highlight">To Your Table</span>
            </h1>
            
            <p className="hero-description">
              Connect directly with local farmers and get the freshest organic produce 
              delivered to your doorstep. Support local agriculture while enjoying the 
              best quality food at fair prices.
            </p>
            
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">500+</div>
                <div className="stat-label">Partner Farmers</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">10,000+</div>
                <div className="stat-label">Happy Customers</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">50+</div>
                <div className="stat-label">Cities Served</div>
              </div>
            </div>
            
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-large hero-btn-primary">
                🛒 Shop Now
              </Link>
              <Link to="/signup" className="btn btn-outline btn-large hero-btn-secondary">
                🤝 Join as Farmer
              </Link>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="hero-image">
              <div className="farm-illustration">
                <div className="farm-element farm-1">🌾</div>
                <div className="farm-element farm-2">🥬</div>
                <div className="farm-element farm-3">🍅</div>
                <div className="farm-element farm-4">🥕</div>
                <div className="farm-element farm-5">🌽</div>
                <div className="farm-element farm-6">🥒</div>
                <div className="farm-element farm-7">🍆</div>
                <div className="farm-element farm-8">🌶️</div>
              </div>
            </div>
            
            <div className="trust-badges">
              <div className="trust-badge">
                <span className="badge-icon">✓</span>
                <span className="badge-text">100% Organic</span>
              </div>
              <div className="trust-badge">
                <span className="badge-icon">✓</span>
                <span className="badge-text">Verified Farmers</span>
              </div>
              <div className="trust-badge">
                <span className="badge-icon">✓</span>
                <span className="badge-text">Fast Delivery</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="hero-search">
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-input-group">
              <input
                type="text"
                className="search-input"
                placeholder="Search for fresh vegetables, fruits, dairy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-btn">
                🔍 Search
              </button>
            </div>
            <div className="search-suggestions">
              <span className="suggestion-label">Popular:</span>
              <Link to="/products?search=tomatoes" className="suggestion-tag">Tomatoes</Link>
              <Link to="/products?search=lettuce" className="suggestion-tag">Lettuce</Link>
              <Link to="/products?search=carrots" className="suggestion-tag">Carrots</Link>
              <Link to="/products?search=milk" className="suggestion-tag">Fresh Milk</Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
