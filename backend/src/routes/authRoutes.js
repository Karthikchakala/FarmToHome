import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { registerSchema, loginSchema } from '../validators/authValidators.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);

export default router;
