const asyncHandler = require('express-async-handler');
const multer = require('multer');
const pestScannerService = require('../services/agriPestScannerService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const scanPest = asyncHandler(async (req, res) => {
  console.log('Pest scan request received', {
    hasFile: !!req.file,
    fileName: req.file?.originalname,
    mimeType: req.file?.mimetype,
    size: req.file?.size,
    userId: req.user?._id || req.user?.id || null,
    userRole: req.user?.role || null
  });

  console.log("Uploaded file type:", req.file.mimetype);

  if (!req.file) {
    console.log('Pest scan rejected: missing image file');
    return res.status(400).json({
      success: false,
      message: 'Image file is required'
    });
  }

  const userId = req.user?._id || req.user?.id || null;
  console.log('Calling pest scanner service', {
    userId,
    mimeType: req.file.mimetype,
    size: req.file.size
  });

  const result = await pestScannerService.identifyPest(req.file.buffer, req.file.mimetype, userId);
  console.log('Pest scanner service result', {
    success: result.success,
    code: result.code || null,
    message: result.message || null,
    hasIdentification: !!result.identification
  });

  if (!result.success) {
    const statusCode = result.code === 'MISSING_API_KEY' ? 503 : 400;
    console.log('Pest scan failed', {
      statusCode,
      code: result.code || null,
      message: result.message || null
    });
    return res.status(statusCode).json({
      success: false,
      message: result.message,
      code: result.code
    });
  }

  const healthScore = await pestScannerService.getHealthScore(result.identification);
  console.log('Pest scan health score calculated', healthScore);

  return res.json({
    success: true,
    data: {
      ...result.identification,
      healthScore
    }
  });
});

module.exports = {
  scanPest,
  upload
};
