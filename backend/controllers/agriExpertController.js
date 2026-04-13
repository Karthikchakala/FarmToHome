const asyncHandler = require('express-async-handler');
const expertService = require('../services/agriExpertService');

const listExperts = asyncHandler(async (req, res) => {
  const result = await expertService.listExperts();
  return res.json({
    success: true,
    data: result
  });
});

const createInquiry = asyncHandler(async (req, res) => {
  const { expertId, topic, message, preferredContact, requesterName, requesterEmail } = req.body;

  if (!expertId || !topic || !message) {
    return res.status(400).json({
      success: false,
      message: 'expertId, topic, and message are required'
    });
  }

  const result = await expertService.createInquiry(req.user, {
    expertId,
    topic,
    message,
    preferredContact,
    requesterName,
    requesterEmail
  });

  return res.status(201).json({
    success: true,
    data: result
  });
});

module.exports = {
  listExperts,
  createInquiry
};
