const asyncHandler = require('express-async-handler');
const aiAssistantService = require('../services/agriAiAssistantService');

const getChatResponse = asyncHandler(async (req, res) => {
  const { query } = req.body;

  console.log('[agriAiAssistantController] POST /api/ai/chat', {
    hasQuery: !!query,
    queryLength: query?.length || 0,
    userId: req.user?.id || null,
    userRole: req.user?.role || null
  });

  if (!query || !query.trim()) {
    console.log('[agriAiAssistantController] rejected empty query');
    return res.status(400).json({
      success: false,
      message: 'Query is required'
    });
  }

  const result = await aiAssistantService.getChatResponse(query.trim(), req.user);

  console.log('[agriAiAssistantController] service result', {
    success: result.success,
    responseLength: result.response?.length || 0,
    sourceCount: result.sources?.length || 0
  });

  return res.json({
    success: true,
    data: result
  });
});

const getFarmingTips = asyncHandler(async (req, res) => {
  console.log('[agriAiAssistantController] GET /api/ai/tips', {
    userId: req.user?.id || null,
    userRole: req.user?.role || null
  });
  const result = await aiAssistantService.getFarmingTips(req.user);

  return res.json({
    success: true,
    data: result
  });
});

module.exports = {
  getChatResponse,
  getFarmingTips
};
