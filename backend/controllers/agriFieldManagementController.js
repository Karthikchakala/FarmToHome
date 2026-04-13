const asyncHandler = require('express-async-handler');
const fieldService = require('../services/agriFieldManagementService');

const getUserId = (req) => req.user?._id || req.user?.id;

const createField = asyncHandler(async (req, res) => {
  const fieldData = req.body;
  const userId = getUserId(req);

  console.log('Field create request received', {
    userId,
    bodyKeys: Object.keys(fieldData || {}),
    bodyPreview: {
      name: fieldData?.name,
      area: fieldData?.area,
      location: fieldData?.location,
      soilType: fieldData?.soilType,
      soilPh: fieldData?.soilPh,
      currentCrop: fieldData?.currentCrop,
      cropStatus: fieldData?.cropStatus
    }
  });

  if (!userId) {
    console.log('Field create rejected: missing authenticated user id');
    return res.status(401).json({
      success: false,
      message: 'Authenticated user id is missing'
    });
  }

  const requiredFields = ['name', 'area', 'location'];
  const missing = requiredFields.filter(field => !fieldData[field]);

  if (missing.length > 0) {
    console.log('Field create rejected: missing required fields', { missing });
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missing.join(', ')}`
    });
  }

  const result = await fieldService.createField(userId, fieldData);
  if (!result.success) {
    console.log('Field create failed', {
      userId,
      message: result.message,
      error: result.error || null
    });
    return res.status(400).json({
      success: false,
      message: result.message
    });
  }

  return res.status(201).json({
    success: true,
    data: result.field
  });
});

const getUserFields = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  console.log('Field list request received', { userId });
  if (!userId) {
    console.log('Field list rejected: missing authenticated user id');
    return res.status(401).json({
      success: false,
      message: 'Authenticated user id is missing'
    });
  }

  const result = await fieldService.getUserFields(userId);
  if (!result.success) {
    console.log('Field list failed', {
      userId,
      message: result.message,
      error: result.error || null
    });
    return res.status(500).json({
      success: false,
      message: result.message
    });
  }

  return res.json({
    success: true,
    data: result.fields
  });
});

const updateField = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  console.log('Field update request received', {
    userId,
    fieldId: req.params.fieldId,
    bodyKeys: Object.keys(req.body || {})
  });
  if (!userId) {
    console.log('Field update rejected: missing authenticated user id');
    return res.status(401).json({
      success: false,
      message: 'Authenticated user id is missing'
    });
  }

  const result = await fieldService.updateField(userId, req.params.fieldId, req.body);
  if (!result.success) {
    console.log('Field update failed', {
      userId,
      fieldId: req.params.fieldId,
      message: result.message,
      error: result.error || null
    });
    return res.status(400).json({
      success: false,
      message: result.message
    });
  }

  return res.json({
    success: true,
    data: result.field
  });
});

const deleteField = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  console.log('Field delete request received', {
    userId,
    fieldId: req.params.fieldId
  });
  if (!userId) {
    console.log('Field delete rejected: missing authenticated user id');
    return res.status(401).json({
      success: false,
      message: 'Authenticated user id is missing'
    });
  }

  const result = await fieldService.deleteField(userId, req.params.fieldId);
  if (!result.success) {
    console.log('Field delete failed', {
      userId,
      fieldId: req.params.fieldId,
      message: result.message,
      error: result.error || null
    });
    return res.status(400).json({
      success: false,
      message: result.message
    });
  }

  return res.json({
    success: true,
    message: result.message
  });
});

module.exports = {
  createField,
  getUserFields,
  updateField,
  deleteField
};
