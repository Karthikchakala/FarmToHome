import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../utils/axiosConfig.js';

const initialState = {
    items: [],
    quantity: 0,
    subtotal: 0,
    totalPrice: 0,
    status: 'idle',
    error: null,
};

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get('/cart');
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to load cart');
    }
});

export const addToCart = createAsyncThunk('cart/addToCart', async ({ productId, quantity }, { rejectWithValue }) => {
    try {
        const response = await api.post('/cart/add', { productId, quantity });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to add item to cart');
    }
});

export const updateCartItem = createAsyncThunk('cart/updateCartItem', async ({ productId, quantity }, { rejectWithValue }) => {
    try {
        const response = await api.put('/cart/update', { productId, quantity });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update cart item');
    }
});

export const removeCartItem = createAsyncThunk('cart/removeCartItem', async (productId, { rejectWithValue }) => {
    try {
        await api.delete(`/cart/remove/${productId}`);
        return productId;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to remove item');
    }
});

export const clearCart = createAsyncThunk('cart/clearCart', async (_, { rejectWithValue }) => {
    try {
        await api.delete('/cart/clear');
        return true;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to clear cart');
    }
});

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch Cart
            .addCase(fetchCart.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchCart.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload.items || [];
                state.quantity = action.payload.quantity || 0;
                state.subtotal = action.payload.subtotal || 0;
                state.totalPrice = action.payload.totalPrice || 0;
            })
            .addCase(fetchCart.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Add to Cart
            .addCase(addToCart.fulfilled, (state) => {
                state.status = 'idle'; // Let the component re-fetch the cart
            })
            // Update Cart
            .addCase(updateCartItem.fulfilled, (state) => {
                state.status = 'idle'; // Force re-fetch
            })
            // Remove Cart Item
            .addCase(removeCartItem.fulfilled, (state, action) => {
                state.items = state.items.filter(item => item.product_id !== action.payload);
                state.status = 'idle'; // Force re-fetch for safety, or we could calculate locally
            })
            // Clear Cart
            .addCase(clearCart.fulfilled, (state) => {
                state.items = [];
                state.quantity = 0;
                state.subtotal = 0;
                state.totalPrice = 0;
            });
    },
});

export default cartSlice.reducer;
