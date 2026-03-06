import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../utils/axiosConfig.js';

export const fetchFarmerProducts = createAsyncThunk(
    'farmerProducts/fetchProducts',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/products/me');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
        }
    }
);

export const createFarmerProduct = createAsyncThunk(
    'farmerProducts/createProduct',
    async (productData, { rejectWithValue }) => {
        try {
            const response = await api.post('/products', productData);
            return response.data.product;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create product');
        }
    }
);

export const updateFarmerProduct = createAsyncThunk(
    'farmerProducts/updateProduct',
    async ({ productId, productData }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/products/${productId}`, productData);
            return response.data.product;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update product');
        }
    }
);

export const deleteFarmerProduct = createAsyncThunk(
    'farmerProducts/deleteProduct',
    async (productId, { rejectWithValue }) => {
        try {
            await api.delete(`/products/${productId}`);
            return productId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete product');
        }
    }
);

export const updateFarmerProductStock = createAsyncThunk(
    'farmerProducts/updateStock',
    async ({ productId, stockQuantity }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/products/${productId}/stock`, { stockQuantity });
            return response.data.product;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update stock');
        }
    }
);

const farmerProductsSlice = createSlice({
    name: 'farmerProducts',
    initialState: {
        products: [],
        status: 'idle',
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch Profile Products
            .addCase(fetchFarmerProducts.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchFarmerProducts.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.products = action.payload || [];
            })
            .addCase(fetchFarmerProducts.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Create Product
            .addCase(createFarmerProduct.fulfilled, (state, action) => {
                state.products.push(action.payload);
            })
            // Update Product
            .addCase(updateFarmerProduct.fulfilled, (state, action) => {
                const index = state.products.findIndex(p => p.id === action.payload.id);
                if (index !== -1) {
                    state.products[index] = action.payload;
                }
            })
            // Update Product Stock
            .addCase(updateFarmerProductStock.fulfilled, (state, action) => {
                const index = state.products.findIndex(p => p.id === action.payload.id);
                if (index !== -1) {
                    state.products[index].stock_quantity = action.payload.stock_quantity;
                }
            })
            // Delete Product
            .addCase(deleteFarmerProduct.fulfilled, (state, action) => {
                state.products = state.products.filter(p => p.id !== action.payload);
            });
    }
});

export default farmerProductsSlice.reducer;
