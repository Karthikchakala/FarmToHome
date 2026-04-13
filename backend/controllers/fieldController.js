const asyncHandler = require('express-async-handler');
const fieldService = require('../services/fieldService');
const getUserId = (req) => req.user?._id || req.user?.id;

const createField = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authenticated user id is missing'
    });
  }
  const fieldData = req.body;

  // Validation
  const requiredFields = ['name', 'area', 'location'];
  const missing = requiredFields.filter(field => !fieldData[field]);

  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missing.join(', ')}`
    });
  }

  if (fieldData.area <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Field area must be greater than 0'
    });
  }

  const result = await fieldService.createField(userId, fieldData);

  if (result.success) {
    res.status(201).json({
      success: true,
      data: result.field
    });
  } else {
    res.status(400).json({
      success: false,
      message: result.message
    });
  }
});

const getUserFields = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authenticated user id is missing'
    });
  }

  const result = await fieldService.getUserFields(userId);

  if (result.success) {
    res.json({
      success: true,
      data: result.fields
    });
  } else {
    res.status(500).json({
      success: false,
      message: result.message
    });
  }
});

const updateField = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authenticated user id is missing'
    });
  }
  const { fieldId } = req.params;
  const updateData = req.body;

  if (!fieldId) {
    return res.status(400).json({
      success: false,
      message: 'Field ID is required'
    });
  }

  const result = await fieldService.updateField(userId, fieldId, updateData);

  if (result.success) {
    res.json({
      success: true,
      data: result.field
    });
  } else {
    res.status(400).json({
      success: false,
      message: result.message
    });
  }
});

const deleteField = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authenticated user id is missing'
    });
  }
  const { fieldId } = req.params;

  if (!fieldId) {
    return res.status(400).json({
      success: false,
      message: 'Field ID is required'
    });
  }

  const result = await fieldService.deleteField(userId, fieldId);

  if (result.success) {
    res.json({
      success: true,
      message: result.message
    });
  } else {
    res.status(400).json({
      success: false,
      message: result.message
    });
  }
});

module.exports = {
  createField,
  getUserFields,
  updateField,
  deleteField
};
