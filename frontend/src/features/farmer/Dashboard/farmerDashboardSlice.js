import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../utils/axiosConfig.js';

export const fetchDashboardStats = createAsyncThunk(
    'farmerDashboard/fetchStats',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/farmer/dashboard');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard stats');
        }
    }
);

const initialState = {
    stats: {
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        lowStockAlerts: []
    },
    status: 'idle',
    error: null
};

const farmerDashboardSlice = createSlice({
    name: 'farmerDashboard',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboardStats.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchDashboardStats.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.stats = action.payload;
            })
            .addCase(fetchDashboardStats.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    }
});

export default farmerDashboardSlice.reducer;
