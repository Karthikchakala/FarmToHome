const asyncHandler = require('express-async-handler');
const pestScannerService = require('../services/pestScannerService');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const scanPest = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Image file is required'
    });
  }

  const result = await pestScannerService.identifyPest(req.file.buffer, req.file.mimetype);

  if (result.success) {
    const healthScore = await pestScannerService.getHealthScore(result.identification);

    res.json({
      success: true,
      data: {
        ...result.identification,
        health_score: healthScore
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: result.message
    });
  }
});

module.exports = {
  scanPest,
  upload
};