import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../utils/axiosConfig.js';

export const fetchMyOrders = createAsyncThunk(
    'orders/fetchMyOrders',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/orders');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
        }
    }
);

export const fetchOrderById = createAsyncThunk(
    'orders/fetchOrderById',
    async (orderId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/orders/${orderId}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch order details');
        }
    }
);

export const cancelMyOrder = createAsyncThunk(
    'orders/cancelMyOrder',
    async (orderId, { rejectWithValue }) => {
        try {
            const response = await api.put(`/orders/${orderId}/cancel`);
            return response.data.order;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to cancel order');
        }
    }
);

const ordersSlice = createSlice({
    name: 'orders',
    initialState: {
        list: [],
        currentOrder: null,
        status: 'idle',
        detailsStatus: 'idle',
        cancelStatus: 'idle',
        error: null
    },
    reducers: {
        clearCurrentOrder: (state) => {
            state.currentOrder = null;
            state.detailsStatus = 'idle';
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch List
            .addCase(fetchMyOrders.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchMyOrders.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.list = action.payload || [];
            })
            .addCase(fetchMyOrders.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })

            // Fetch Details
            .addCase(fetchOrderById.pending, (state) => {
                state.detailsStatus = 'loading';
            })
            .addCase(fetchOrderById.fulfilled, (state, action) => {
                state.detailsStatus = 'succeeded';
                state.currentOrder = action.payload;
            })
            .addCase(fetchOrderById.rejected, (state, action) => {
                state.detailsStatus = 'failed';
                state.error = action.payload;
            })

            // Cancel Order
            .addCase(cancelMyOrder.pending, (state) => {
                state.cancelStatus = 'loading';
            })
            .addCase(cancelMyOrder.fulfilled, (state, action) => {
                state.cancelStatus = 'succeeded';
                if (state.currentOrder && state.currentOrder.order_id === action.payload.id) {
                    state.currentOrder.status = 'CANCELLED';
                }
                const index = state.list.findIndex(o => o.order_id === action.payload.id);
                if (index !== -1) {
                    state.list[index].status = 'CANCELLED';
                }
            })
            .addCase(cancelMyOrder.rejected, (state, action) => {
                state.cancelStatus = 'failed';
                state.error = action.payload;
            });
    }
});

export const { clearCurrentOrder } = ordersSlice.actions;
export default ordersSlice.reducer;
