import axios from 'axios'
import cartAPI from './cartAPI'
import orderAPI from './orderAPI'
import messageAPI from './messageAPI'
import profileAPI from './profileAPI'
import subscriptionAPI from './subscriptionAPI'
import paymentAPI from './paymentAPI'
import farmerAPI from './farmerAPI'
import reviewAPI from './reviewAPI'
import { feedbackAPI } from './feedbackAPI'
import dealerAPI from './dealerAPI'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Only logout if it's an auth endpoint error, not general API errors
      const isAuthEndpoint = error.config?.url?.includes('/auth/')
      if (isAuthEndpoint) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
}

// Product API calls
export const productAPI = {
  getProducts: (params = {}) => api.get('/products', { params }),
  getFeaturedProducts: (limit = 8) => api.get('/products/featured', { params: { limit } }),
  getProductById: (id) => api.get(`/products/${id}`),
  getProductsByFarmer: (farmerId, params = {}) => api.get(`/products/farmer/${farmerId}`, { params }),
  getCategories: () => api.get('/products/categories'),
  searchProducts: (query, params = {}) => api.get('/products/search', { params: { q: query, ...params } }),
  getNearbyProducts: (params = {}) => api.get('/products/nearby', { params }),
}

export { cartAPI, orderAPI, messageAPI, profileAPI, subscriptionAPI, paymentAPI, farmerAPI, reviewAPI, feedbackAPI, dealerAPI }

export default api
