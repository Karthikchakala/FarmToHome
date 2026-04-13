const axios = require('axios');

class AgriAiAssistantService {
  constructor() {
    this.baseUrl = process.env.AI_BACKEND_URL || 'http://localhost:8000';
  }

  getUserId(userOrId) {
    if (!userOrId) return null;
    if (typeof userOrId === 'string') return userOrId;
    return userOrId.id || userOrId._id || userOrId.userId || null;
  }

  isConnectionError(error) {
    const code = error?.code || error?.cause?.code;
    return ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNABORTED'].includes(code);
  }

  getUnavailableMessage() {
    return (
      "The AI assistant backend isn't running right now. " +
      "Start the Python RAG service in `FarmToHome/python-backend` on port 8000, then try again."
    );
  }

  async postQuestion(endpoint, question, userId = null) {
    console.log('[agriAiAssistantService] POST attempt', {
      endpoint,
      baseUrl: this.baseUrl,
      questionLength: question?.length || 0,
      userId
    });

    const response = await axios.post(
      `${this.baseUrl}${endpoint}`,
      {
        question,
        query: question,
        user_id: userId
      },
      {
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const payload = response.data || {};

    console.log('[agriAiAssistantService] POST success', {
      endpoint,
      status: response.status,
      payloadKeys: Object.keys(payload),
      mode: payload.mode || null,
      responseLength: (payload.answer || payload.response || '').length
    });

    return {
      success: true,
      response: payload.answer || payload.response || '',
      sources: payload.sources || [],
      mode: payload.mode || 'rag'
    };
  }

  async getChatResponse(query, userId) {
    const question = String(query || '').trim();
    const normalizedUserId = this.getUserId(userId);

    if (!question) {
      return {
        success: false,
        response: 'A question is required.',
        sources: [],
        mode: 'error'
      };
    }

    const endpoints = ['/chat', '/api/rag/chat'];

    for (const endpoint of endpoints) {
      try {
        return await this.postQuestion(endpoint, question, normalizedUserId);
      } catch (error) {
        console.error('[agriAiAssistantService] POST failed', {
          endpoint,
          message: error.message,
          code: error.code || null,
          status: error.response?.status || null,
          data: error.response?.data || null
        });

        if (!this.isConnectionError(error)) {
          continue;
        }
        // If the Python backend is down, keep trying the alternate route and
        // then return a clear message instead of a generic fallback.
      }
    }

    return {
      success: false,
      response: this.getUnavailableMessage(),
      sources: [],
      mode: 'error'
    };
  }

  async getFarmingTips() {
    return {
      success: true,
      tips: [
        'Ask crop-specific questions for the most grounded answers.',
        'Include the crop name, soil type, and growth stage when you can.',
        'Use the assistant for yield, pests, storage, and pricing guidance.',
        'If the answer seems incomplete, ask a follow-up with more field context.'
      ].slice(0, 4)
    };
  }
}

module.exports = new AgriAiAssistantService();
