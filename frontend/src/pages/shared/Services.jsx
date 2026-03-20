import './Services.css'

const Services = () => {
  const services = [
    {
      icon: '🚚',
      title: 'Farm Fresh Delivery',
      description: 'Get fresh produce delivered directly from farms to your doorstep within 24 hours of harvest.',
      features: ['Same-day delivery', 'Temperature-controlled packaging', 'Real-time tracking']
    },
    {
      icon: '📦',
      title: 'Subscription Boxes',
      description: 'Enjoy regular deliveries of seasonal produce with our customizable subscription plans.',
      features: ['Weekly/Monthly options', 'Customizable boxes', 'Skip or pause anytime']
    },
    {
      icon: '🏪',
      title: 'Farmer\'s Market Online',
      description: 'Browse and purchase from multiple local farmers in one convenient marketplace.',
      features: ['Compare prices', 'Read farmer reviews', 'Bulk ordering discounts']
    },
    {
      icon: '🌱',
      title: 'Organic Certification',
      description: 'All our products are certified organic, ensuring you get the healthiest produce available.',
      features: ['100% organic guarantee', 'Pesticide-free', 'Non-GMO verified']
    },
    {
      icon: '💳',
      title: 'Secure Payments',
      description: 'Multiple payment options with secure processing and easy refunds.',
      features: ['Cash on delivery', 'Online payments', 'Digital wallet support']
    },
    {
      icon: '🔄',
      title: 'Easy Returns',
      description: 'Not satisfied with your order? We offer hassle-free returns and refunds.',
      features: ['30-day return policy', 'Quality guarantee', 'Instant refunds']
    }
  ]

  const processSteps = [
    { step: 1, title: 'Browse Products', description: 'Explore fresh produce from local farmers in your area' },
    { step: 2, title: 'Place Order', description: 'Add items to cart and checkout with secure payment options' },
    { step: 3, title: 'Farm to Door', description: 'Farmers harvest and pack your order with care' },
    { step: 4, title: 'Enjoy Freshness', description: 'Receive your order and enjoy farm-fresh goodness' }
  ]

  return (
    <div className="services">
      {/* Hero Section */}
      <section className="services-hero">
        <div className="container">
          <div className="hero-content">
            <h1>Our Services</h1>
            <p>Discover how Farm to Table makes it easy to access fresh, organic produce while supporting local farmers and sustainable agriculture.</p>
          </div>
        </div>
      </section>

      {/* Main Services */}
      <section className="main-services">
        <div className="container">
          <h2 className="section-title">What We Offer</h2>
          <div className="services-grid">
            {services.map((service, index) => (
              <div key={index} className="service-card">
                <div className="service-header">
                  <div className="service-icon">{service.icon}</div>
                  <h3>{service.title}</h3>
                </div>
                <p className="service-description">{service.description}</p>
                <ul className="service-features">
                  {service.features.map((feature, idx) => (
                    <li key={idx}>
                      <span className="check-icon">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How Our Service Works</h2>
          <div className="process-grid">
            {processSteps.map((item) => (
              <div key={item.step} className="process-card">
                <div className="process-number">{item.step}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="benefits">
        <div className="container">
          <div className="benefits-content">
            <div className="benefits-text">
              <h2>Why Choose Our Services?</h2>
              <p>Our platform is designed to provide the best experience for both farmers and consumers. We bridge the gap between farm and table, ensuring everyone benefits from direct trade.</p>
              <div className="benefits-list">
                <div className="benefit-item">
                  <span className="benefit-icon">🌾</span>
                  <div>
                    <h4>Fresh from Farm</h4>
                    <p>Products reach you within 24 hours of harvest</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">💰</span>
                  <div>
                    <h4>Fair Prices</h4>
                    <p>No middlemen means better prices for everyone</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🌱</span>
                  <div>
                    <h4>100% Organic</h4>
                    <p>All products are certified organic and pesticide-free</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🤝</span>
                  <div>
                    <h4>Support Local</h4>
                    <p>Directly support farmers in your community</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="benefits-image">
              <div className="benefits-illustration">
                <span className="benefits-icon">🥬</span>
                <span className="benefits-icon">🍅</span>
                <span className="benefits-icon">🥕</span>
                <span className="benefits-icon">🌽</span>
                <span className="benefits-icon">🍆</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery Areas */}
      <section className="delivery-areas">
        <div className="container">
          <h2 className="section-title">Service Areas</h2>
          <div className="areas-grid">
            <div className="area-card">
              <h3>🏙️ Metropolitan Cities</h3>
              <p>Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad, Pune, Ahmedabad</p>
            </div>
            <div className="area-card">
              <h3>🏘️ Tier-2 Cities</h3>
              <p>Surat, Jaipur, Lucknow, Kanpur, Nagpur, Indore, Patna, Coimbatore</p>
            </div>
            <div className="area-card">
              <h3>🌾 Rural Areas</h3>
              <p>Expanding to cover villages and towns within 50km of major cities</p>
            </div>
          </div>
          <div className="expansion-note">
            <p>🚀 We're constantly expanding! Check if we deliver to your area during signup.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Experience Farm Fresh Goodness?</h2>
            <p>Join thousands of satisfied customers who enjoy fresh, organic produce delivered to their doorstep.</p>
            <div className="cta-buttons">
              <button className="btn btn-primary btn-large">🛒 Start Shopping</button>
              <button className="btn btn-outline btn-large">📝 Join as Farmer</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Services
