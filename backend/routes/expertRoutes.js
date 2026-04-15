const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const {
  listExperts,
  createInquiry
} = require('../controllers/agriExpertController');
const {
  registerExpert,
  getExpertProfile,
  updateExpertProfile,
  getAvailableExperts,
  updateExpertOnlineStatus,
  createConsultation,
  getExpertConsultations,
  getFarmerConsultations,
  updateConsultationStatus,
  getConsultationMessages,
  sendConsultationMessage,
  sendExpertSuggestion
} = require('../controllers/expertController');

// Public routes (existing)
router.get('/', listExperts);
router.post('/inquiries', authenticate, createInquiry);

// Expert registration and profile management
router.post('/register', authenticate, authorize('expert'), registerExpert);
router.get('/profile', authenticate, authorize('expert'), getExpertProfile);
router.put('/profile', authenticate, authorize('expert'), updateExpertProfile);

// Expert online status
router.put('/online-status', authenticate, authorize('expert'), updateExpertOnlineStatus);

// Available experts for farmers
router.get('/available', getAvailableExperts);

// Consultation functionality
router.post('/consultations', authenticate, authorize('farmer'), createConsultation);
router.get('/consultations', authenticate, authorize('expert'), getExpertConsultations);
router.get('/consultations/farmer', authenticate, authorize('farmer'), getFarmerConsultations);
router.put('/consultations/:consultationId/status', authenticate, updateConsultationStatus);
router.get('/consultations/:consultationId/messages', authenticate, getConsultationMessages);
router.post('/consultations/:consultationId/messages', authenticate, sendConsultationMessage);
router.post('/consultations/:consultationId/suggestions', authenticate, authorize('expert'), sendExpertSuggestion);

module.exports = router;
