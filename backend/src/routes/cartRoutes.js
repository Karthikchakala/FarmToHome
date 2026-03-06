import express from 'express';
import { addToCart, getCart, updateCartItem, removeCartItem, clearCart, checkout } from '../controllers/cartController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { addToCartSchema, updateCartSchema, checkoutSchema } from '../validators/cartValidators.js';

const router = express.Router();

// All cart routes require a consumer role
router.use(protect);
router.use(authorizeRoles('consumer'));

router.post('/add', validate(addToCartSchema), addToCart);
router.get('/', getCart);
router.put('/update', validate(updateCartSchema), updateCartItem);
router.delete('/remove/:productId', removeCartItem);
router.delete('/clear', clearCart);
router.post('/checkout', validate(checkoutSchema), checkout);

export default router;
