const axios = require('axios');

class AIAssistantService {
  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.baseUrl = process.env.AI_BACKEND_URL || 'http://localhost:8000'; // Assuming Python backend is running
  }

  async getChatResponse(query, userId) {
    try {
      console.log('[AIAssistantService] getChatResponse request', {
        queryLength: query?.length || 0,
        userId,
        baseUrl: this.baseUrl
      });
      // Call the Python backend RAG service
      const response = await axios.post(`${this.baseUrl}/api/rag/chat`, {
        query,
        user_id: userId
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('[AIAssistantService] getChatResponse success', {
        hasResponse: !!response.data?.response,
        sourceCount: response.data?.sources?.length || 0
      });

      return {
        success: true,
        response: response.data.response,
        sources: response.data.sources || []
      };
    } catch (error) {
      console.error('[AIAssistantService] getChatResponse failed', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      // Fallback to simple response if Python backend not available
      return {
        success: false,
        response: "I'm sorry, the AI assistant is currently unavailable. Please try again later.",
        error: error.message
      };
    }
  }

  async getFarmingTips() {
    // Simple static tips as fallback
    console.log('[AIAssistantService] getFarmingTips called');
    const tips = [
      "Regular soil testing helps maintain optimal nutrient levels for better crop yield.",
      "Implement crop rotation to prevent soil depletion and reduce pest problems.",
      "Monitor weather patterns closely as they directly impact farming decisions.",
      "Keep detailed records of your farming activities for better planning."
    ];

    return {
      success: true,
      tips: tips.slice(0, 3)
    };
  }
}

module.exports = new AIAssistantService();
