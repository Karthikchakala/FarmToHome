import express from 'express';
import { createProduct, updateProduct, deleteProduct, updateStock, getMyProducts, exploreProducts, getProductDetails } from '../controllers/productController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { createProductSchema, updateProductSchema, searchProductsSchema } from '../validators/productValidators.js';

const router = express.Router();

// Public / Consumer Route for searching nearby farmers
router.get('/', validate(searchProductsSchema), exploreProducts);
router.get('/:id', getProductDetails);

// Farmer Protected Routes
router.use(protect);
router.use(authorizeRoles('farmer', 'admin'));

router.post('/', validate(createProductSchema), createProduct);
router.get('/me', getMyProducts);
router.put('/:id', validate(updateProductSchema), updateProduct);
router.delete('/:id', deleteProduct);

import { updateStockSchema } from '../validators/farmerValidators.js';
router.put('/:id/stock', validate(updateStockSchema), updateStock);

export default router;
