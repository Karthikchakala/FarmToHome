import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api'; // Assuming a pre-configured axios instance is here.

// Thunks
export const fetchDashboardData = createAsyncThunk('admin/fetchDashboard', async () => {
    const response = await api.get('/admin/dashboard');
    return response.data.data;
});

export const fetchFarmers = createAsyncThunk('admin/fetchFarmers', async () => {
    const response = await api.get('/admin/farmers');
    return response.data.data;
});

export const fetchConsumers = createAsyncThunk('admin/fetchConsumers', async () => {
    const response = await api.get('/admin/consumers');
    return response.data.data;
});

export const fetchAdminOrders = createAsyncThunk('admin/fetchOrders', async (filters) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/admin/orders?${params}`);
    return response.data.data;
});

export const fetchReviews = createAsyncThunk('admin/fetchReviews', async () => {
    const response = await api.get('/admin/reviews');
    return response.data.data;
});

export const approveFarmerAction = createAsyncThunk('admin/approveFarmer', async (farmerId) => {
    const response = await api.put(`/admin/farmers/${farmerId}/approve`);
    return response.data.data;
});

export const suspendFarmerAction = createAsyncThunk('admin/suspendFarmer', async (farmerId) => {
    const response = await api.put(`/admin/farmers/${farmerId}/suspend`);
    return response.data.data;
});

export const banConsumerAction = createAsyncThunk('admin/banConsumer', async (consumerId) => {
    const response = await api.put(`/admin/consumers/${consumerId}/ban`);
    return response.data.data;
});

// Slices
export const adminDashboardSlice = createSlice({
    name: 'adminDashboard',
    initialState: { data: null, status: 'idle', error: null },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboardData.pending, (state) => { state.status = 'loading'; })
            .addCase(fetchDashboardData.fulfilled, (state, action) => { state.status = 'succeeded'; state.data = action.payload; })
            .addCase(fetchDashboardData.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message; });
    }
});

export const farmersManagementSlice = createSlice({
    name: 'farmersManagement',
    initialState: { farmers: [], status: 'idle', error: null },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchFarmers.pending, (state) => { state.status = 'loading'; })
            .addCase(fetchFarmers.fulfilled, (state, action) => { state.status = 'succeeded'; state.farmers = action.payload; })
            .addCase(approveFarmerAction.fulfilled, (state, action) => {
                const index = state.farmers.findIndex(f => f.farmer_id === action.payload.id);
                if (index !== -1) state.farmers[index].verification_status = true;
            })
            .addCase(suspendFarmerAction.fulfilled, (state, action) => {
                const index = state.farmers.findIndex(f => f.farmer_id === action.payload.farmerId);
                if (index !== -1) state.farmers[index].is_active = false;
            });
    }
});

export const consumersManagementSlice = createSlice({
    name: 'consumersManagement',
    initialState: { consumers: [], status: 'idle', error: null },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchConsumers.pending, (state) => { state.status = 'loading'; })
            .addCase(fetchConsumers.fulfilled, (state, action) => { state.status = 'succeeded'; state.consumers = action.payload; })
            .addCase(banConsumerAction.fulfilled, (state, action) => {
                const index = state.consumers.findIndex(c => c.consumer_id === action.payload.consumerId);
                if (index !== -1) state.consumers[index].account_status = false;
            });
    }
});

export const adminOrdersSlice = createSlice({
    name: 'adminOrders',
    initialState: { orders: [], status: 'idle', error: null },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAdminOrders.pending, (state) => { state.status = 'loading'; })
            .addCase(fetchAdminOrders.fulfilled, (state, action) => { state.status = 'succeeded'; state.orders = action.payload; });
    }
});

export const analyticsSlice = createSlice({
    name: 'analytics',
    initialState: { reviews: [], status: 'idle', error: null },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchReviews.pending, (state) => { state.status = 'loading'; })
            .addCase(fetchReviews.fulfilled, (state, action) => { state.status = 'succeeded'; state.reviews = action.payload; });
    }
});

export const adminReducers = {
    dashboard: adminDashboardSlice.reducer,
    farmers: farmersManagementSlice.reducer,
    consumers: consumersManagementSlice.reducer,
    orders: adminOrdersSlice.reducer,
    analytics: analyticsSlice.reducer
};
