import api from './api'

export const expertAPI = {
  getExperts: () => api.get('/experts'),
  createInquiry: (payload) => api.post('/experts/inquiries', payload),
}

export default expertAPI
