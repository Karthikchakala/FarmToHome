import * as cartRepository from '../repositories/cartRepository.js';
import * as orderRepository from '../repositories/orderRepository.js';
import * as productRepository from '../repositories/productRepository.js';

export const addProductToCart = async (consumerId, productId, quantity) => {
    // Basic stock check
    const product = await productRepository.getProductById(productId);
    if (!product) throw new Error('Product not found');
    if (product.stock_quantity < quantity) throw new Error('Insufficient stock');

    const existingItem = await cartRepository.getCartItem(consumerId, productId);
    if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (product.stock_quantity < newQuantity) throw new Error('Insufficient stock for the requested total quantity');
        return await cartRepository.updateCartItemQuantity(existingItem.id, newQuantity);
    } else {
        return await cartRepository.createCartItem(consumerId, productId, quantity);
    }
};

export const viewCart = async (consumerId) => {
    const items = await cartRepository.getCartItemsWithDetails(consumerId);
    let subtotal = 0;

    // Check if items are within stock limits and calculate total
    const cartItems = items.map(item => {
        const itemTotal = parseFloat(item.price) * item.quantity;
        subtotal += itemTotal;
        return {
            ...item,
            itemTotal,
            isOutOfStock: item.stock_quantity < item.quantity
        };
    });

    return {
        items: cartItems,
        quantity: cartItems.reduce((acc, item) => acc + item.quantity, 0),
        subtotal,
        totalPrice: subtotal // Add delivery fees here in the future if needed
    };
};

export const updateProductQuantity = async (consumerId, productId, quantity) => {
    const existingItem = await cartRepository.getCartItem(consumerId, productId);
    if (!existingItem) throw new Error('Item not in cart');

    if (quantity === 0) {
        await cartRepository.removeCartItem(consumerId, productId);
        return { message: 'Item removed from cart' };
    }

    const product = await productRepository.getProductById(productId);
    if (!product) throw new Error('Product not found');
    if (product.stock_quantity < quantity) throw new Error('Insufficient stock');

    return await cartRepository.updateCartItemQuantity(existingItem.id, quantity);
};

export const removeItemFromCart = async (consumerId, productId) => {
    await cartRepository.removeCartItem(consumerId, productId);
};

export const clearUserCart = async (consumerId) => {
    await cartRepository.clearCart(consumerId);
};

export const checkout = async (consumerId, deliveryAddress, deliverySlot, paymentMethod) => {
    const cart = await viewCart(consumerId);

    if (cart.items.length === 0) {
        throw new Error('Cart is empty.');
    }

    if (cart.items.some(item => item.isOutOfStock)) {
        throw new Error('Some items in your cart are out of stock. Please update your cart.');
    }

    // Group items by farmer
    const itemsByFarmer = cart.items.reduce((acc, item) => {
        if (!acc[item.farmer_id]) acc[item.farmer_id] = [];
        acc[item.farmer_id].push(item);
        return acc;
    }, {});

    const orders = [];

    // Create an order for each farmer
    for (const farmerId of Object.keys(itemsByFarmer)) {
        const farmerItems = itemsByFarmer[farmerId];
        const newOrder = await orderRepository.createOrderTransaction(
            consumerId,
            farmerId,
            farmerItems.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
            deliveryAddress
        );
        orders.push(newOrder);
    }

    return orders;
};
