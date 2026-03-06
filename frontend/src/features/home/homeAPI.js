import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const fetchFeaturedProducts = async () => {
    const res = await axios.get(`${API_BASE}/home/featured-products`);
    return res.data.data || [];
};

export const fetchNearbyProducts = async (lat, lng) => {
    const res = await axios.get(`${API_BASE}/products/explore`, { params: { lat, lng } });
    return res.data || [];
};

export const fetchFeaturedFarmers = async () => {
    const res = await axios.get(`${API_BASE}/home/featured-farmers`);
    return res.data.data || [];
};

export const fetchReviews = async () => {
    const res = await axios.get(`${API_BASE}/home/reviews`);
    return res.data.data || [];
};

export const fetchHomeConfig = async () => {
    const res = await axios.get(`${API_BASE}/home/config`);
    return res.data.data || {};
};
