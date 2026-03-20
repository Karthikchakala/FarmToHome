import './FarmerStory.css'

const FarmerStory = ({ farmer, index }) => {
  return (
    <div className={`farmer-story ${index % 2 === 1 ? 'reverse' : ''}`}>
      <div className="farmer-image">
        <div className="farmer-avatar">
          <span className="avatar-emoji">👨‍🌾</span>
        </div>
        <div className="farm-badges">
          <div className="badge organic">
            <span>🌱</span>
            <span>Organic</span>
          </div>
          <div className="badge verified">
            <span>✓</span>
            <span>Verified</span>
          </div>
        </div>
      </div>
      
      <div className="farmer-content">
        <div className="farmer-header">
          <h3 className="farmer-name">{farmer.name}</h3>
          <p className="farm-name">{farmer.farmName}</p>
          <div className="farmer-rating">
            <span className="stars">⭐⭐⭐⭐⭐</span>
            <span className="rating-text">{farmer.rating} (234 reviews)</span>
          </div>
        </div>
        
        <div className="farmer-story-text">
          <p className="story-quote">"</p>
          <p className="story-content">
            {farmer.story}
          </p>
          <p className="story-quote">"</p>
        </div>
        
        <div className="farmer-stats">
          <div className="stat">
            <span className="stat-number">{farmer.yearsFarming}</span>
            <span className="stat-label">Years Farming</span>
          </div>
          <div className="stat">
            <span className="stat-number">{farmer.productsCount}</span>
            <span className="stat-label">Products</span>
          </div>
          <div className="stat">
            <span className="stat-number">{farmer.customersServed}</span>
            <span className="stat-label">Happy Customers</span>
          </div>
        </div>
        
        <div className="farmer-location">
          <span className="location-icon">📍</span>
          <span className="location-text">{farmer.location}</span>
        </div>
      </div>
    </div>
  )
}

const FarmerStories = () => {
  const farmers = [
    {
      name: "Rajesh Kumar",
      farmName: "Green Valley Organics",
      rating: 4.8,
      story: "I've been farming for over 15 years, and joining Farm to Table has transformed my business. I can now sell directly to customers who appreciate the hard work that goes into growing organic vegetables. The platform has helped me double my income while providing fresh, chemical-free produce to families in my community.",
      yearsFarming: 15,
      productsCount: 25,
      customersServed: 500,
      location: "Bangalore, Karnataka"
    },
    {
      name: "Priya Sharma",
      farmName: "Sunshine Dairy Farm",
      rating: 4.9,
      story: "As a third-generation dairy farmer, I believe in providing pure, unadulterated milk to consumers. Farm to Table helped me reach customers who value quality over quantity. My cows are grass-fed and treated with love, and that reflects in the taste of our milk and dairy products.",
      yearsFarming: 8,
      productsCount: 12,
      customersServed: 300,
      location: "Pune, Maharashtra"
    },
    {
      name: "Amit Patel",
      farmName: "Heritage Harvest",
      rating: 4.7,
      story: "I left my corporate job to pursue organic farming, and it's been the most rewarding decision. Farm to Table gave me the platform to connect with health-conscious consumers who understand the value of organic produce. Together, we're building a healthier future.",
      yearsFarming: 6,
      productsCount: 18,
      customersServed: 250,
      location: "Ahmedabad, Gujarat"
    }
  ]

  return (
    <section className="farmer-stories-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Farmer Stories</h2>
          <p className="section-subtitle">Meet the passionate farmers behind your fresh produce</p>
        </div>
        
        <div className="stories-container">
          {farmers.map((farmer, index) => (
            <FarmerStory key={index} farmer={farmer} index={index} />
          ))}
        </div>
        
        <div className="section-footer">
          <button className="btn btn-outline btn-large">
            🤝 Join Our Farmer Community
          </button>
        </div>
      </div>
    </section>
  )
}

export default FarmerStories
