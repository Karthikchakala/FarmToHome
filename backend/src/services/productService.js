import * as productRepository from '../repositories/productRepository.js';
import * as farmerRepository from '../repositories/farmerRepository.js';

export const addProduct = async (farmerUserId, productData) => {
    const farmer = await farmerRepository.getFarmerProfileByUserId(farmerUserId);
    if (!farmer) throw new Error('Farmer profile not found');

    if (!farmer.is_approved) {
        throw new Error('Only approved farmers can add products');
    }

    return await productRepository.createProduct(farmer.id, productData);
};

export const editProduct = async (farmerUserId, productId, productData) => {
    const farmer = await farmerRepository.getFarmerProfileByUserId(farmerUserId);
    if (!farmer) throw new Error('Farmer profile not found');

    return await productRepository.updateProduct(farmer.id, productId, productData);
};

export const removeProduct = async (farmerUserId, productId) => {
    const farmer = await farmerRepository.getFarmerProfileByUserId(farmerUserId);
    if (!farmer) throw new Error('Farmer profile not found');

    const deletedProduct = await productRepository.softDeleteProduct(farmer.id, productId);
    if (!deletedProduct) throw new Error('Product not found or unauthorized');
    return deletedProduct;
};

export const modifyStock = async (farmerUserId, productId, stockQuantity) => {
    const farmer = await farmerRepository.getFarmerProfileByUserId(farmerUserId);
    if (!farmer) throw new Error('Farmer profile not found');

    const updatedProduct = await productRepository.updateProductStock(farmer.id, productId, stockQuantity);
    if (!updatedProduct) throw new Error('Product not found or unauthorized');
    return updatedProduct;
};

export const listFarmerProducts = async (farmerUserId) => {
    const farmer = await farmerRepository.getFarmerProfileByUserId(farmerUserId);
    if (!farmer) throw new Error('Farmer profile not found');

    return await productRepository.getFarmerProducts(farmer.id);
};

export const searchHyperlocalProducts = async (lat, lng, filters = {}) => {
    if (!lat || !lng) {
        throw new Error('Latitude and Longitude are required for hyperlocal search');
    }
    return await productRepository.findNearbyProducts(lat, lng, 7, filters); // Default 7km
};

export const getProductDetails = async (productId) => {
    const product = await productRepository.getProductById(productId);
    if (!product) throw new Error('Product not found');

    const reviews = await productRepository.getProductReviews(productId);
    return { ...product, reviews };
};
