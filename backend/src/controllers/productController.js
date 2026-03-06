import * as productService from '../services/productService.js';
import logger from '../config/logger.js';

export const createProduct = async (req, res, next) => {
    try {
        const product = await productService.addProduct(req.user.id, req.body);
        res.status(201).json({ message: 'Product added successfully', product });
    } catch (error) {
        next(error);
    }
};

export const updateProduct = async (req, res, next) => {
    try {
        const product = await productService.editProduct(req.user.id, req.params.id, req.body);
        if (!product) {
            res.status(404);
            throw new Error('Product not found or unauthorized');
        }
        res.json({ message: 'Product updated successfully', product });
    } catch (error) {
        next(error);
    }
};

export const deleteProduct = async (req, res, next) => {
    try {
        await productService.removeProduct(req.user.id, req.params.id);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const updateStock = async (req, res, next) => {
    try {
        const { stockQuantity } = req.body;
        const product = await productService.modifyStock(req.user.id, req.params.id, stockQuantity);
        res.json({ message: 'Stock updated successfully', product });
    } catch (error) {
        next(error);
    }
};

export const getMyProducts = async (req, res, next) => {
    try {
        const products = await productService.listFarmerProducts(req.user.id);
        res.json(products);
    } catch (error) {
        next(error);
    }
};

export const exploreProducts = async (req, res, next) => {
    try {
        const { latitude, longitude, search, category, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
        if (!latitude || !longitude) {
            res.status(400);
            throw new Error('Please provide latitude and longitude query parameters');
        }

        const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
        const filters = {
            search,
            category,
            minPrice: minPrice !== undefined ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice !== undefined ? parseFloat(maxPrice) : undefined,
            limit: parseInt(limit),
            offset
        };

        const result = await productService.searchHyperlocalProducts(parseFloat(lat), parseFloat(lng), filters);
        res.json({
            ...result,
            page: parseInt(page),
            totalPages: Math.ceil(result.totalCount / parseInt(limit))
        });
    } catch (error) {
        next(error);
    }
};

export const getProductDetails = async (req, res, next) => {
    try {
        const product = await productService.getProductDetails(req.params.id);
        res.json(product);
    } catch (error) {
        if (error.message === 'Product not found') res.status(404);
        next(error);
    }
};
