const asyncHandler = require('express-async-handler');
const aiAssistantService = require('../services/aiAssistantService');

const getChatResponse = asyncHandler(async (req, res) => {
  const { query } = req.body;
  const userId = req.user?.id;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: 'Query is required'
    });
  }

  const result = await aiAssistantService.getChatResponse(query, userId);

  res.json({
    success: result.success,
    data: result
  });
});

const getFarmingTips = asyncHandler(async (req, res) => {
  const result = await aiAssistantService.getFarmingTips();

  res.json({
    success: true,
    data: result
  });
});

module.exports = {
  getChatResponse,
  getFarmingTips
};