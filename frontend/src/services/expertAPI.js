import api from './api'

export const expertAPI = {
  // Existing endpoints
  getExperts: () => api.get('/experts'),
  createInquiry: (payload) => api.post('/experts/inquiries', payload),
  
  // Expert profile management
  registerExpert: (expertData) => api.post('/experts/register', expertData),
  getExpertProfile: () => api.get('/experts/profile'),
  updateExpertProfile: (profileData) => api.put('/experts/profile', profileData),
  
  // Available experts for farmers
  getAvailableExperts: (params = {}) => api.get('/experts/available', { params }),
  
  // Consultation functionality
  createConsultation: (consultationData) => api.post('/experts/consultations', consultationData),
  getExpertConsultations: (params = {}) => api.get('/experts/consultations', { params }),
  getFarmerConsultations: (params = {}) => api.get('/experts/consultations/farmer', { params }),
  updateConsultationStatus: (consultationId, statusData) => api.put(`/experts/consultations/${consultationId}/status`, statusData),
  getConsultationMessages: (consultationId) => api.get(`/experts/consultations/${consultationId}/messages`),
  sendConsultationMessage: (consultationId, messageData) => api.post(`/experts/consultations/${consultationId}/messages`, messageData),
  
  // Expert-specific endpoints
  getExpertSchedule: (params = {}) => api.get('/experts/schedule', { params }),
  updateExpertSchedule: (scheduleData) => api.put('/experts/schedule', scheduleData),
  getExpertAnalytics: (params = {}) => api.get('/experts/analytics', { params }),
  getExpertEarnings: (params = {}) => api.get('/experts/earnings', { params }),
  
  // Reviews and ratings
  getExpertReviews: (params = {}) => api.get('/experts/reviews', { params }),
  createExpertReview: (reviewData) => api.post('/experts/reviews', reviewData)
}

export default expertAPI
