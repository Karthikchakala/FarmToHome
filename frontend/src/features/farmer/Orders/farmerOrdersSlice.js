import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../utils/axiosConfig.js';

export const fetchFarmerOrders = createAsyncThunk(
    'farmerOrders/fetchOrders',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/farmer/orders');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
        }
    }
);

export const updateFarmerOrderStatus = createAsyncThunk(
    'farmerOrders/updateStatus',
    async ({ orderId, status }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/orders/${orderId}/status`, { status });
            return response.data.order;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update order status');
        }
    }
);

const farmerOrdersSlice = createSlice({
    name: 'farmerOrders',
    initialState: {
        orders: [],
        status: 'idle',
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchFarmerOrders.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchFarmerOrders.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.orders = action.payload || [];
            })
            .addCase(fetchFarmerOrders.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(updateFarmerOrderStatus.fulfilled, (state, action) => {
                const index = state.orders.findIndex(o => o.order_id === action.payload.id);
                if (index !== -1) {
                    state.orders[index].status = action.payload.status;
                }
            });
    }
});

export default farmerOrdersSlice.reducer;
