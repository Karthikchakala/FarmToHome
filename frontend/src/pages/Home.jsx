import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productAPI } from '../services/api'
import SEO from '../components/SEO'
import Button from '../components/Button'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import LazyImage from '../components/LazyImage'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'
import './Home.css'

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true)
        const response = await productAPI.getFeaturedProducts(8)
        
        if (response.data.success) {
          setFeaturedProducts(response.data.data)
        }
      } catch (err) {
        setError('Failed to load featured products')
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedProducts()
  }, [])

  const services = [
    { icon: '🚚', title: 'Fast Delivery', description: 'Fresh produce delivered within 24 hours' },
    { icon: '🌱', title: '100% Organic', description: 'All products are certified organic' },
    { icon: '💰', title: 'Fair Prices', description: 'Direct from farmers, no middlemen' },
    { icon: '🔄', title: 'Easy Returns', description: 'Not satisfied? Get your money back' },
  ]

  const nearbyFarmers = [
    { id: 1, name: 'Green Valley Farm', location: '5 km away', rating: 4.8, specialty: 'Vegetables' },
    { id: 2, name: 'Sunshine Organics', location: '8 km away', rating: 4.9, specialty: 'Fruits' },
    { id: 3, name: 'Happy Harvest', location: '12 km away', rating: 4.7, specialty: 'Dairy' },
  ]

  return (
    <>
      <SEO 
        title="Farm to Table - Fresh Organic Produce Direct from Local Farmers"
        description="Connect directly with local farmers for fresh, organic produce. Support sustainable farming and enjoy farm-fresh vegetables, fruits, dairy, and more delivered to your doorstep."
        keywords="farm to table, organic produce, local farmers, fresh vegetables, sustainable farming, direct farm sales"
      />
      
      <div className="home">
        {/* Hero Section */}
        <section className="hero">
          <div className="container">
            <div className="hero-content">
              <div className="hero-text">
                <h1>Fresh From Farm to Your Table</h1>
                <p>Connect directly with local farmers and get the freshest organic produce delivered to your doorstep</p>
                <div className="hero-buttons">
                  <Link to="/products" className="btn btn-primary btn-large">Start Shopping</Link>
                  <Link to="/about" className="btn btn-outline btn-large">Learn More</Link>
                </div>
              </div>
              <div className="hero-image">
                <LazyImage 
                  src="/images/hero-farm.jpg" 
                  alt="Fresh farm produce"
                  className="hero-img"
                  fallback="🥬"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="services">
          <div className="container">
            <h2>Why Choose Farm to Table?</h2>
            <div className="services-grid">
              {services.map((service, index) => (
                <Card key={index} className="service-card">
                  <div className="service-icon">{service.icon}</div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="featured-products">
          <div className="container">
            <h2>Featured Products</h2>
            
            {loading ? (
              <LoadingSpinner size="large" text="Loading featured products..." />
            ) : error ? (
              <EmptyState
                title="Oops! Something went wrong"
                description={error}
                actionText="Try Again"
                onAction={() => window.location.reload()}
              />
            ) : featuredProducts.length === 0 ? (
              <EmptyState
                title="No Featured Products"
                description="Check back later for our featured farm products"
                actionText="Browse All Products"
                actionLink="/products"
              />
            ) : (
              <div className="products-grid">
                {featuredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
            
            <div className="section-cta">
              <Link to="/products" className="btn btn-outline btn-large">View All Products</Link>
            </div>
          </div>
        </section>

        {/* Nearby Farmers Section */}
        <section className="nearby-farmers">
          <div className="container">
            <h2>Farmers Near You</h2>
            <div className="farmers-grid">
              {nearbyFarmers.map((farmer) => (
                <Card key={farmer.id} className="farmer-card">
                  <div className="farmer-info">
                    <h3>{farmer.name}</h3>
                    <p className="farmer-location">📍 {farmer.location}</p>
                    <p className="farmer-rating">⭐ {farmer.rating}</p>
                    <p className="farmer-specialty">{farmer.specialty}</p>
                  </div>
                  <Link to={`/farmers/${farmer.id}`} className="btn btn-outline btn-small">
                    View Farm
                  </Link>
                </Card>
              ))}
            </div>
            <div className="section-cta">
              <Link to="/farmers" className="btn btn-primary btn-large">Find More Farmers</Link>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="how-it-works">
          <div className="container">
            <h2>How It Works</h2>
            <div className="steps-grid">
              <div className="step">
                <div className="step-number">1</div>
                <h3>Browse Products</h3>
                <p>Explore fresh produce from local farmers in your area</p>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <h3>Place Order</h3>
                <p>Add items to cart and checkout with secure payment</p>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <h3>Get Delivery</h3>
                <p>Receive fresh produce at your doorstep within 24 hours</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="testimonials">
          <div className="container">
            <h2>What Our Customers Say</h2>
            <div className="testimonials-grid">
              <Card className="testimonial-card">
                <div className="testimonial-content">
                  <p>"The freshest vegetables I've ever had! Love supporting local farmers."</p>
                  <div className="testimonial-author">
                    <span className="author-name">Sarah M.</span>
                    <span className="author-location">Mumbai</span>
                  </div>
                </div>
              </Card>
              <Card className="testimonial-card">
                <div className="testimonial-content">
                  <p>"Great quality produce and excellent service. Farm to Table is amazing!"</p>
                  <div className="testimonial-author">
                    <span className="author-name">Rahul K.</span>
                    <span className="author-location">Delhi</span>
                  </div>
                </div>
              </Card>
              <Card className="testimonial-card">
                <div className="testimonial-content">
                  <p>"Finally, a platform that connects us directly with farmers. Highly recommended!"</p>
                  <div className="testimonial-author">
                    <span className="author-name">Priya S.</span>
                    <span className="author-location">Bangalore</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta">
          <div className="container">
            <div className="cta-content">
              <h2>Ready to Experience Fresh Farm Produce?</h2>
              <p>Join thousands of satisfied customers who get fresh, organic produce delivered to their doorstep.</p>
              <div className="cta-buttons">
                <Link to="/products" className="btn btn-primary btn-large">🛍️ Start Shopping</Link>
                <Link to="/signup" className="btn btn-outline btn-large">Create Account</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </>
  )
}

export default Home
