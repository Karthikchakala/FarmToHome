const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const {
  listExperts,
  createInquiry
} = require('../controllers/agriExpertController');

router.use(authenticate);

router.get('/', listExperts);
router.post('/inquiries', createInquiry);

module.exports = router;
