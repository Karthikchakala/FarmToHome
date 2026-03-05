import * as homeRepository from '../repositories/homeRepository.js';

// GET /api/home/featured-products
export const getFeaturedProducts = async (req, res, next) => {
    try {
        const products = await homeRepository.getFeaturedProducts(8);
        res.json({ success: true, data: products });
    } catch (error) {
        next(error);
    }
};

// GET /api/home/featured-farmers
export const getFeaturedFarmers = async (req, res, next) => {
    try {
        const farmers = await homeRepository.getFeaturedFarmers(6);
        res.json({ success: true, data: farmers });
    } catch (error) {
        next(error);
    }
};

// GET /api/home/reviews
export const getReviews = async (req, res, next) => {
    try {
        const reviews = await homeRepository.getReviews(6);
        res.json({ success: true, data: reviews });
    } catch (error) {
        next(error);
    }
};

// GET /api/home/config
// Returns static config: quotes, categories, subscription plans
export const getHomeConfig = async (req, res) => {
    const config = {
        quotes: [
            { text: "The nations that destroy their soil destroy themselves.", author: "Franklin D. Roosevelt" },
            { text: "To forget how to dig the earth and to tend the soil is to forget ourselves.", author: "Mahatma Gandhi" },
            { text: "Agriculture is our wisest pursuit, because it will in the end contribute most to real wealth, good morals, and happiness.", author: "Thomas Jefferson" },
            { text: "The ultimate goal of farming is not the growing of crops, but the cultivation and perfection of human beings.", author: "Masanobu Fukuoka" },
            { text: "Farming is a profession of hope.", author: "Brian Brett" },
        ],
        categories: [
            { id: 'vegetables', name: 'Vegetables', icon: '🥦', color: '#2e7d32' },
            { id: 'fruits', name: 'Fruits', icon: '🍎', color: '#e53935' },
            { id: 'dairy', name: 'Dairy', icon: '🥛', color: '#1565c0' },
            { id: 'grains', name: 'Grains', icon: '🌾', color: '#f57f17' },
            { id: 'organic', name: 'Organic Produce', icon: '🌿', color: '#00695c' },
            { id: 'herbs', name: 'Herbs & Spices', icon: '🌱', color: '#6a1b9a' },
        ],
        subscriptions: [
            {
                id: 'weekly-veg',
                name: 'Weekly Vegetable Box',
                price: 349,
                period: 'week',
                description: 'Fresh seasonal vegetables delivered weekly',
                contents: ['5 types of vegetables', 'Approx. 3-4 kg', 'Sourced from 50km radius', 'No pesticides'],
                popular: false,
            },
            {
                id: 'monthly-fruit',
                name: 'Monthly Fruit Basket',
                price: 599,
                period: 'month',
                description: 'Hand-picked seasonal fruits every month',
                contents: ['6 varieties of fruits', 'Approx. 4-5 kg', 'Farm fresh, zero cold-chain', 'Includes exotic varieties'],
                popular: true,
            },
            {
                id: 'seasonal-combo',
                name: 'Seasonal Farm Box',
                price: 799,
                period: 'month',
                description: 'Best of farm produce across categories',
                contents: ['Vegetables + Fruits', 'Dairy products', 'Artisan grains or lentils', "Farmer's surprise item"],
                popular: false,
            },
        ],
    };
    res.json({ success: true, data: config });
};
