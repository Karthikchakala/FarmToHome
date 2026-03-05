import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => (
    <footer className="footer" role="contentinfo">
        <div className="footer__main">
            <div className="footer__container">
                {/* Column 1: About */}
                <div className="footer__col footer__col--wide">
                    <div className="footer__logo">
                        <span className="footer__logo-icon">🌾</span>
                        <div>
                            <div className="footer__logo-name">Farm to Table</div>
                            <div className="footer__logo-tagline">Fresh & Local</div>
                        </div>
                    </div>
                    <p className="footer__about">
                        Connecting consumers directly with local farmers for fresh, healthy, and sustainably grown produce.
                        Empowering agriculture, one order at a time.
                    </p>
                    <div className="footer__social">
                        <a href="https://facebook.com" className="footer__social-link" aria-label="Facebook" target="_blank" rel="noopener noreferrer">📘</a>
                        <a href="https://instagram.com" className="footer__social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer">📸</a>
                        <a href="https://twitter.com" className="footer__social-link" aria-label="Twitter" target="_blank" rel="noopener noreferrer">🐦</a>
                        <a href="https://youtube.com" className="footer__social-link" aria-label="YouTube" target="_blank" rel="noopener noreferrer">▶️</a>
                    </div>
                </div>

                {/* Column 2: Quick Links */}
                <div className="footer__col">
                    <h3 className="footer__heading">Quick Links</h3>
                    <ul className="footer__links">
                        <li><Link to="/products">Products</Link></li>
                        <li><Link to="/farmers">Farmers</Link></li>
                        <li><Link to="/subscriptions">Subscriptions</Link></li>
                        <li><Link to="/about">About Us</Link></li>
                        <li><Link to="/register?role=farmer">Become a Farmer</Link></li>
                    </ul>
                </div>

                {/* Column 3: Support */}
                <div className="footer__col">
                    <h3 className="footer__heading">Support</h3>
                    <ul className="footer__links">
                        <li><Link to="/contact">Contact Us</Link></li>
                        <li><Link to="/help">Help Center</Link></li>
                        <li><Link to="/faq">FAQs</Link></li>
                        <li><Link to="/tracking">Track Order</Link></li>
                        <li><Link to="/returns">Returns Policy</Link></li>
                    </ul>
                </div>

                {/* Column 4: Contact */}
                <div className="footer__col">
                    <h3 className="footer__heading">Contact</h3>
                    <div className="footer__contact">
                        <div className="footer__contact-item">
                            <span>📍</span>
                            <span>123 Farm Road, Pune, Maharashtra 411001</span>
                        </div>
                        <div className="footer__contact-item">
                            <span>📞</span>
                            <a href="tel:+919876543210">+91 98765 43210</a>
                        </div>
                        <div className="footer__contact-item">
                            <span>✉️</span>
                            <a href="mailto:hello@farmtotable.in">hello@farmtotable.in</a>
                        </div>
                    </div>
                    <div className="footer__app-badges">
                        <div className="footer__app-badge">📱 App Store</div>
                        <div className="footer__app-badge">🤖 Google Play</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer__bottom">
            <div className="footer__bottom-container">
                <p className="footer__copyright">
                    © {new Date().getFullYear()} Farm to Table. All rights reserved.
                </p>
                <div className="footer__legal">
                    <Link to="/terms">Terms of Service</Link>
                    <Link to="/privacy">Privacy Policy</Link>
                    <Link to="/cookies">Cookie Policy</Link>
                </div>
            </div>
        </div>
    </footer>
);

export default Footer;
