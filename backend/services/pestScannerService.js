const axios = require('axios');
const FormData = require('form-data');

class PestScannerService {
  constructor() {
    this.plantIdApiKey = process.env.PLANT_ID_API_KEY;
    this.plantIdUrl = 'https://api.plant.id/v2/identify';
  }

  async identifyPest(imageBuffer, imageType = 'image/jpeg') {
    try {
      const formData = new FormData();
      formData.append('images', imageBuffer, {
        filename: 'plant.jpg',
        contentType: imageType
      });

      // Plant.id API parameters for disease identification
      formData.append('modifiers', JSON.stringify(['crops_fast', 'diseases']));
      formData.append('plant_details', JSON.stringify(['common_names', 'url', 'description']));

      const response = await axios.post(this.plantIdUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          'Api-Key': this.plantIdApiKey
        }
      });

      const result = response.data;

      if (result.suggestions && result.suggestions.length > 0) {
        const topSuggestion = result.suggestions[0];
        const disease = topSuggestion.plant_details?.disease || {};

        return {
          success: true,
          identification: {
            plant_name: topSuggestion.plant_name,
            probability: topSuggestion.probability,
            disease: {
              name: disease.name || 'No disease detected',
              probability: disease.probability || 0,
              treatment: disease.treatment || 'No specific treatment available'
            }
          }
        };
      }

      return {
        success: false,
        message: 'No identification results found'
      };
    } catch (error) {
      console.error('Pest Scanner Error:', error.message);
      return {
        success: false,
        message: 'Failed to identify pest/disease. Please try again.',
        error: error.message
      };
    }
  }

  async getHealthScore(identification) {
    // Simple health score based on disease probability
    const diseaseProb = identification.disease?.probability || 0;
    const healthScore = Math.max(0, 100 - (diseaseProb * 100));

    return {
      score: Math.round(healthScore),
      status: healthScore > 80 ? 'Healthy' : healthScore > 50 ? 'Moderate' : 'Poor'
    };
  }
}

module.exports = new PestScannerService();