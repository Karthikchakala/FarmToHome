import api from './api'

const normalizeSimulationResponse = (response) => {
  const data = response?.data
  if (!data) return response

  if (data.data) {
    return response
  }

  return {
    ...response,
    data: {
      ...data,
      data: data.simulation || data.crops || data
    }
  }
}

export const cropSimulatorAPI = {
  getSupportedCrops: () => api.get('/simulator/crops').then(normalizeSimulationResponse),
  runSimulation: (payload) => api.post('/simulator/simulate', payload).then(normalizeSimulationResponse),
}

export default cropSimulatorAPI
