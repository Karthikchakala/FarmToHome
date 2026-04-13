const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { scanPest, upload } = require('../controllers/agriPestScannerController');

// All pest scanner routes require authentication
router.use(authenticate);

router.post('/scan', upload.single('image'), scanPest);

module.exports = router;
