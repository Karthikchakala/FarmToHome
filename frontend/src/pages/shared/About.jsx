import './About.css'

const About = () => {
  const teamMembers = [
    { name: 'Raj Kumar', role: 'Founder & CEO', bio: 'Passionate about sustainable agriculture and connecting farmers directly with consumers.' },
    { name: 'Priya Sharma', role: 'Head of Operations', bio: 'Ensuring smooth delivery operations and customer satisfaction.' },
    { name: 'Amit Patel', role: 'Tech Lead', bio: 'Building the technology platform that powers Farm to Table.' },
    { name: 'Sneha Reddy', role: 'Community Manager', bio: 'Building relationships with farmers and local communities.' },
  ]

  const stats = [
    { number: '500+', label: 'Partner Farmers' },
    { number: '10,000+', label: 'Happy Customers' },
    { number: '50+', label: 'Cities Served' },
    { number: '100%', label: 'Organic Products' },
  ]

  return (
    <div className="about">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="container">
          <div className="about-hero-content">
            <h1>About Farm to Table</h1>
            <p>We're on a mission to revolutionize how people access fresh, organic produce while supporting local farmers and sustainable agriculture.</p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="our-story">
        <div className="container">
          <div className="story-content">
            <div className="story-text">
              <h2>Our Story</h2>
              <p>Farm to Table was born from a simple observation: while farmers work hard to grow fresh, organic produce, consumers struggle to find truly fresh food at fair prices. The traditional supply chain involves multiple middlemen, driving up costs and reducing freshness.</p>
              <p>Founded in 2023, we set out to create a direct connection between farmers and consumers. Our platform eliminates middlemen, ensuring farmers get fair prices while consumers receive the freshest produce at reasonable rates.</p>
              <p>Today, we're proud to serve thousands of families across multiple cities, working with hundreds of dedicated farmers who share our commitment to quality, sustainability, and community.</p>
            </div>
            <div className="story-image">
              <div className="story-illustration">
                <span className="story-icon">🌾</span>
                <span className="story-icon">🥬</span>
                <span className="story-icon">🚚</span>
                <span className="story-icon">🏠</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="mission-vision">
        <div className="container">
          <div className="mv-grid">
            <div className="mv-card">
              <h3>🎯 Our Mission</h3>
              <p>To create a sustainable food ecosystem by connecting local farmers directly with consumers, ensuring fair prices for farmers and fresh, organic produce for consumers.</p>
            </div>
            <div className="mv-card">
              <h3>🔮 Our Vision</h3>
              <p>To become India's most trusted platform for fresh, organic produce, revolutionizing the agricultural supply chain and promoting sustainable farming practices.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="values">
        <div className="container">
          <h2 className="section-title">Our Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">🌱</div>
              <h3>Sustainability</h3>
              <p>We promote organic farming practices that protect the environment and ensure long-term agricultural sustainability.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🤝</div>
              <h3>Fair Trade</h3>
              <p>We ensure farmers receive fair prices for their hard work, eliminating exploitative middlemen from the supply chain.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">💚</div>
              <h3>Quality</h3>
              <p>We maintain the highest quality standards, ensuring only the freshest, most nutritious produce reaches our customers.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🏘️</div>
              <h3>Community</h3>
              <p>We build strong relationships between farmers and consumers, creating a sense of community and mutual support.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="team">
        <div className="container">
          <h2 className="section-title">Meet Our Team</h2>
          <div className="team-grid">
            {teamMembers.map((member, index) => (
              <div key={index} className="team-card">
                <div className="team-avatar">
                  <span className="avatar-emoji">👤</span>
                </div>
                <h3>{member.name}</h3>
                <p className="team-role">{member.role}</p>
                <p className="team-bio">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Join Our Movement</h2>
            <p>Whether you're a farmer looking to reach more customers or a consumer seeking fresh, organic produce, we invite you to join the Farm to Table community.</p>
            <div className="cta-buttons">
              <button className="btn btn-primary btn-large">📝 Sign Up as Farmer</button>
              <button className="btn btn-outline btn-large">🛒 Start Shopping</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
