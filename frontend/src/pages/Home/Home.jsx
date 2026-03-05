import React from 'react';
import {
    Navbar,
    HeroSection,
    CategorySection,
    FeaturedProducts,
    FarmersNearYou,
    WhyChooseUs,
    HowItWorks,
    Testimonials,
    FeaturedFarmers,
    Subscriptions,
    QuotesSection,
    CTASection,
    Footer,
} from '../../features/home/index.js';
import './Home.css';

/**
 * Home page — assembles all 13 homepage sections.
 * All data is fetched dynamically inside each section component via homeAPI.js.
 */
const Home = () => {
    return (
        <div className="home-page">
            {/* 1. Navigation Header */}
            <Navbar />

            {/* 2. Hero Section */}
            <HeroSection />

            {/* 3. Categories Section */}
            <CategorySection />

            {/* 4. Featured Products */}
            <FeaturedProducts />

            {/* 5. Farmers Near You */}
            <FarmersNearYou />

            {/* 6. Why Choose Us */}
            <WhyChooseUs />

            {/* 7. How It Works */}
            <HowItWorks />

            {/* 8. Testimonials */}
            <Testimonials />

            {/* 9. Featured Farmers */}
            <FeaturedFarmers />

            {/* 10. Subscriptions */}
            <Subscriptions />

            {/* 11. Agriculture Quotes */}
            <QuotesSection />

            {/* 12. Farmer CTA */}
            <CTASection />

            {/* 13. Footer */}
            <Footer />
        </div>
    );
};

export default Home;
