import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const createRazorpayOrder = createAsyncThunk(
    'payments/createOrder',
    async (orderId, { rejectWithValue }) => {
        try {
            const response = await api.post('/payments/create-order', { orderId });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create payment order');
        }
    }
);

export const verifyPayment = createAsyncThunk(
    'payments/verify',
    async (paymentData, { rejectWithValue }) => {
        try {
            const response = await api.post('/payments/verify', paymentData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Payment verification failed');
        }
    }
);

export const getRazorpayKey = createAsyncThunk(
    'payments/getKey',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/payments/key');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch Razorpay key');
        }
    }
);

const paymentsSlice = createSlice({
    name: 'payments',
    initialState: {
        razorpayKey: null,
        currentOrder: null,
        status: 'idle', // idle | loading | succeeded | failed
        error: null,
        verificationStatus: 'idle', // idle | verifying | success | failed
    },
    reducers: {
        clearPaymentState: (state) => {
            state.currentOrder = null;
            state.status = 'idle';
            state.error = null;
            state.verificationStatus = 'idle';
        }
    },
    extraReducers: (builder) => {
        builder
            // Get Key
            .addCase(getRazorpayKey.fulfilled, (state, action) => {
                state.razorpayKey = action.payload.data.key;
            })
            // Create Order
            .addCase(createRazorpayOrder.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(createRazorpayOrder.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.currentOrder = action.payload.data;
            })
            .addCase(createRazorpayOrder.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Verify
            .addCase(verifyPayment.pending, (state) => {
                state.verificationStatus = 'verifying';
            })
            .addCase(verifyPayment.fulfilled, (state) => {
                state.verificationStatus = 'success';
            })
            .addCase(verifyPayment.rejected, (state, action) => {
                state.verificationStatus = 'failed';
                state.error = action.payload;
            });
    },
});

export const { clearPaymentState } = paymentsSlice.actions;
export default paymentsSlice.reducer;
