const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const {
  createField,
  getUserFields,
  updateField,
  deleteField
} = require('../controllers/agriFieldManagementController');

// All field routes require authentication
router.use(authenticate);

router.post('/', (req, res, next) => {
  console.log('Field route POST /api/fields reached');
  next();
}, createField);
router.get('/', (req, res, next) => {
  console.log('Field route GET /api/fields reached');
  next();
}, getUserFields);
router.put('/:fieldId', (req, res, next) => {
  console.log('Field route PUT /api/fields/:fieldId reached', { fieldId: req.params.fieldId });
  next();
}, updateField);
router.delete('/:fieldId', (req, res, next) => {
  console.log('Field route DELETE /api/fields/:fieldId reached', { fieldId: req.params.fieldId });
  next();
}, deleteField);

module.exports = router;
