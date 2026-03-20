import './Testimonial.css'

const TestimonialCard = ({ testimonial, index }) => {
  return (
    <div className="testimonial-card">
      <div className="testimonial-content">
        <div className="testimonial-rating">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="star">⭐</span>
          ))}
        </div>
        
        <p className="testimonial-text">
          "{testimonial.text}"
        </p>
        
        <div className="testimonial-author">
          <div className="author-avatar">
            <span className="avatar-emoji">{testimonial.avatar}</span>
          </div>
          <div className="author-info">
            <h4 className="author-name">{testimonial.name}</h4>
            <p className="author-location">{testimonial.location}</p>
            <p className="author-product">🥬 {testimonial.product}</p>
          </div>
        </div>
      </div>
      
      <div className="testimonial-badge">
        <span className="badge-text">Verified Purchase</span>
        <span className="badge-icon">✓</span>
      </div>
    </div>
  )
}

const Testimonials = () => {
  const testimonials = [
    {
      name: "Anjali Sharma",
      location: "Mumbai, Maharashtra",
      avatar: "👩",
      product: "Organic Vegetables",
      text: "I've been using Farm to Table for 6 months now, and the quality is exceptional. The vegetables are fresh, last longer, and taste amazing. I love supporting local farmers while getting the best produce for my family."
    },
    {
      name: "Rahul Verma",
      location: "Delhi, NCR",
      avatar: "👨",
      product: "Fresh Dairy",
      text: "The milk and dairy products are pure and unadulterated. My kids love the fresh taste, and I have peace of mind knowing I'm giving them the best. The delivery is always on time and the packaging is excellent."
    },
    {
      name: "Priya Nair",
      location: "Bangalore, Karnataka",
      avatar: "👩",
      product: "Seasonal Fruits",
      text: "The variety and quality of fruits is outstanding. I especially love the seasonal mangoes and strawberries. The prices are reasonable compared to organic stores, and the convenience of home delivery is a huge plus."
    },
    {
      name: "Amit Singh",
      location: "Pune, Maharashtra",
      avatar: "👨",
      product: "Organic Grains",
      text: "As someone who values health and nutrition, Farm to Table has been a game-changer. The organic grains and cereals are top-notch. I can feel the difference in taste and quality compared to regular supermarket products."
    },
    {
      name: "Sneha Patel",
      location: "Ahmedabad, Gujarat",
      avatar: "👩",
      product: "Fresh Herbs",
      text: "The fresh herbs add so much flavor to my cooking! They're always aromatic and fresh. I appreciate knowing exactly which farm my herbs come from. The app makes ordering so convenient."
    },
    {
      name: "Karthik Reddy",
      location: "Hyderabad, Telangana",
      avatar: "👨",
      product: "Mixed Produce Box",
      text: "The subscription box is perfect for my busy schedule. I get a variety of fresh produce every week, and it's always well-packaged and fresh. It's helped me eat healthier and try new vegetables."
    }
  ]

  return (
    <section className="testimonials-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">What Our Customers Say</h2>
          <p className="section-subtitle">Real reviews from happy customers across India</p>
        </div>
        
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} index={index} />
          ))}
        </div>
        
        <div className="section-footer">
          <div className="testimonials-stats">
            <div className="stat">
              <div className="stat-number">4.8</div>
              <div className="stat-label">Average Rating</div>
              <div className="stat-stars">⭐⭐⭐⭐⭐</div>
            </div>
            <div className="stat">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Happy Customers</div>
            </div>
            <div className="stat">
              <div className="stat-number">95%</div>
              <div className="stat-label">Repeat Customers</div>
            </div>
          </div>
          
          <button className="btn btn-primary btn-large">
            📝 Write a Review
          </button>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
