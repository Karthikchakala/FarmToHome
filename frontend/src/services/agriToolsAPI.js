import api from './api'

export const agriToolsAPI = {
  askAssistant: (query) => {
    console.log('[agriToolsAPI] askAssistant request', {
      queryLength: query?.length || 0,
      apiUrl: import.meta.env.VITE_API_URL,
    })
    return api.post('/ai/chat', { query })
  },
  getAssistantTips: () => {
    console.log('[agriToolsAPI] getAssistantTips request', {
      apiUrl: import.meta.env.VITE_API_URL,
    })
    return api.get('/ai/tips')
  },

  scanPest: (file) => {
    console.log('[agriToolsAPI] scanPest request', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      apiUrl: import.meta.env.VITE_API_URL,
    })
    const formData = new FormData()
    formData.append('image', file)
    return api.post('/pest/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getYieldCrops: () => api.get('/yield/crops'),
  predictYield: (payload) => api.post('/yield/predict', payload),

  getClimateCrops: () => api.get('/climate/crops'),
  simulateClimate: (payload) => api.post('/climate/simulate', payload),

  getMonetizerCrops: () => api.get('/monetizer/crops'),
  getMonetizerForecast: (params) => api.get('/monetizer/forecast', { params }),
  getMarketInsights: (cropType) => api.get(`/monetizer/insights/${cropType}`),

  getFields: () => api.get('/fields'),
  createField: (payload) => api.post('/fields', payload),
  updateField: (fieldId, payload) => api.put(`/fields/${fieldId}`, payload),
  deleteField: (fieldId) => api.delete(`/fields/${fieldId}`),
}

export default agriToolsAPI
