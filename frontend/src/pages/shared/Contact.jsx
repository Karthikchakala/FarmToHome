import { useState } from 'react'
import './Contact.css'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })

  const [formStatus, setFormStatus] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Here you would normally send the form data to your backend
    console.log('Form submitted:', formData)
    setFormStatus('success')
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    })
    setTimeout(() => setFormStatus(''), 5000)
  }

  const contactInfo = [
    { icon: '📞', label: 'Phone', value: '+91 98765 43210' },
    { icon: '📧', label: 'Email', value: 'support@farmtotable.com' },
    { icon: '📍', label: 'Address', value: '123 Green Valley, Farm Road, Bangalore - 560001' },
    { icon: '⏰', label: 'Business Hours', value: 'Mon-Sat: 9AM - 6PM, Sun: 10AM - 4PM' }
  ]

  const faqs = [
    {
      question: 'How do I place an order?',
      answer: 'Simply browse our products, add items to your cart, and checkout. You can choose from various payment options including cash on delivery.'
    },
    {
      question: 'How long does delivery take?',
      answer: 'We offer same-day delivery for orders placed before 12 PM. Otherwise, delivery is typically within 24 hours.'
    },
    {
      question: 'Are all products organic?',
      answer: 'Yes! All our products are certified organic and sourced directly from verified organic farms.'
    },
    {
      question: 'Can I become a seller on your platform?',
      answer: 'Absolutely! If you\'re a farmer, you can sign up as a seller and start reaching customers directly.'
    },
    {
      question: 'What is your return policy?',
      answer: 'We offer a 30-day return policy for any products that don\'t meet our quality standards.'
    }
  ]

  return (
    <div className="contact">
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="container">
          <div className="hero-content">
            <h1>Contact Us</h1>
            <p>Have questions or feedback? We'd love to hear from you. Get in touch with our team and we'll respond as soon as possible.</p>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="contact-info">
        <div className="container">
          <div className="info-grid">
            {contactInfo.map((info, index) => (
              <div key={index} className="info-card">
                <div className="info-icon">{info.icon}</div>
                <div className="info-content">
                  <h3>{info.label}</h3>
                  <p>{info.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="contact-main">
        <div className="container">
          <div className="contact-grid">
            {/* Contact Form */}
            <div className="contact-form-section">
              <h2>Send us a Message</h2>
              {formStatus === 'success' && (
                <div className="alert alert-success">
                  Thank you for your message! We'll get back to you soon.
                </div>
              )}
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="name">Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="form-input"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-input"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="form-input"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="subject">Subject *</label>
                  <select
                    id="subject"
                    name="subject"
                    className="form-select"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="order">Order Related</option>
                    <option value="farmer">Farmer Registration</option>
                    <option value="complaint">Complaint</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    className="form-textarea"
                    value={formData.message}
                    onChange={handleChange}
                    rows="5"
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary btn-large">
                  📤 Send Message
                </button>
              </form>
            </div>

            {/* Map & Additional Info */}
            <div className="contact-additional">
              <div className="map-placeholder">
                <h3>Our Location</h3>
                <div className="map-illustration">
                  <span className="map-icon">🗺️</span>
                  <p>Interactive map showing our office location</p>
                </div>
              </div>

              <div className="quick-links">
                <h3>Quick Links</h3>
                <ul>
                  <li><a href="/about">📖 About Us</a></li>
                  <li><a href="/services">🛠️ Our Services</a></li>
                  <li><a href="/products">🥬 Shop Products</a></li>
                  <li><a href="/signup">📝 Sign Up</a></li>
                  <li><a href="/login">🤝 Login</a></li>
                </ul>
              </div>

              <div className="social-links">
                <h3>Follow Us</h3>
                <div className="social-icons">
                  <a href="#" className="social-icon">📘</a>
                  <a href="#" className="social-icon">📷</a>
                  <a href="#" className="social-icon">🐦</a>
                  <a href="#" className="social-icon">📱</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <h3>❓ {faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Still Have Questions?</h2>
            <p>Our customer support team is here to help you with any queries or concerns you may have.</p>
            <div className="cta-buttons">
              <button className="btn btn-primary btn-large">📞 Call Us Now</button>
              <button className="btn btn-outline btn-large">💬 Start Live Chat</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Contact
