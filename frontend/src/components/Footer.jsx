import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Our Story', href: '/about' },
      { name: 'Careers', href: '#' },
      { name: 'Press', href: '#' },
      { name: 'Blog', href: '#' }
    ],
    support: [
      { name: 'Help Center', href: '#' },
      { name: 'Contact Us', href: '/contact' },
      { name: 'FAQs', href: '#' },
      { name: 'Shipping Info', href: '#' },
      { name: 'Returns', href: '#' }
    ],
    farmers: [
      { name: 'Join as Farmer', href: '/signup' },
      { name: 'Farmer Resources', href: '#' },
      { name: 'Success Stories', href: '#' },
      { name: 'Growing Guidelines', href: '#' },
      { name: 'Community Forum', href: '#' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Cookie Policy', href: '#' },
      { name: 'Refund Policy', href: '#' },
      { name: 'Farmer Agreement', href: '#' }
    ]
  }

  const socialLinks = [
    { name: 'Facebook', icon: '📘', href: '#' },
    { name: 'Instagram', icon: '📷', href: '#' },
    { name: 'Twitter', icon: '🐦', href: '#' },
    { name: 'WhatsApp', icon: '📱', href: '#' },
    { name: 'YouTube', icon: '📺', href: '#' }
  ]

  return (
    <footer className="footer">
      {/* Newsletter Section */}
      <div className="footer-newsletter">
        <div className="container">
          <div className="newsletter-content">
            <div className="newsletter-text">
              <h3>🌱 Get Fresh Updates</h3>
              <p>Subscribe to our newsletter for seasonal produce updates, farmer stories, and exclusive offers!</p>
            </div>
            <form className="newsletter-form">
              <input
                type="email"
                placeholder="Enter your email address"
                className="newsletter-input"
                required
              />
              <button type="submit" className="btn btn-primary">
                📧 Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="footer-main">
        <div className="container">
          <div className="footer-content">
            {/* Brand Section */}
            <div className="footer-brand">
              <div className="brand-logo">
                <h2>🌱 Farm to Table</h2>
              </div>
              <p className="brand-description">
                Connecting local farmers with conscious consumers to deliver fresh, organic produce 
                directly from farm to your table. Supporting sustainable agriculture and healthy communities.
              </p>
              <div className="brand-stats">
                <div className="stat-item">
                  <span className="stat-number">500+</span>
                  <span className="stat-label">Farmers</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">50+</span>
                  <span className="stat-label">Cities</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">Organic</span>
                </div>
              </div>
              <div className="social-links">
                <h4>Follow Us</h4>
                <div className="social-icons">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      className="social-icon"
                      aria-label={social.name}
                    >
                      <span>{social.icon}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Links Sections */}
            <div className="footer-links">
              <div className="link-column">
                <h3>Company</h3>
                <ul>
                  {footerLinks.company.map((link) => (
                    <li key={link.name}>
                      <Link to={link.href}>{link.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="link-column">
                <h3>Support</h3>
                <ul>
                  {footerLinks.support.map((link) => (
                    <li key={link.name}>
                      <Link to={link.href}>{link.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="link-column">
                <h3>For Farmers</h3>
                <ul>
                  {footerLinks.farmers.map((link) => (
                    <li key={link.name}>
                      <Link to={link.href}>{link.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="link-column">
                <h3>Legal</h3>
                <ul>
                  {footerLinks.legal.map((link) => (
                    <li key={link.name}>
                      <Link to={link.href}>{link.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* App Download Section */}
          <div className="footer-app">
            <div className="app-content">
              <div className="app-text">
                <h3>📱 Get Our App</h3>
                <p>Order fresh produce on the go with our mobile app</p>
              </div>
              <div className="app-buttons">
                <button className="app-btn">
                  <span className="app-icon">🍎</span>
                  <div className="app-text-small">
                    <span className="app-small-text">Download on the</span>
                    <span className="app-large-text">App Store</span>
                  </div>
                </button>
                <button className="app-btn">
                  <span className="app-icon">🤖</span>
                  <div className="app-text-small">
                    <span className="app-small-text">Get it on</span>
                    <span className="app-large-text">Google Play</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-content">
            <div className="footer-copyright">
              <p>&copy; {currentYear} Farm to Table. All rights reserved.</p>
              <p>Made with ❤️ for farmers and food lovers across India</p>
            </div>
            
            <div className="footer-badges">
              <div className="badge">
                <span className="badge-icon">🌱</span>
                <span className="badge-text">100% Organic Certified</span>
              </div>
              <div className="badge">
                <span className="badge-icon">🔒</span>
                <span className="badge-text">Secure Payments</span>
              </div>
              <div className="badge">
                <span className="badge-icon">🚚</span>
                <span className="badge-text">Fast Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
