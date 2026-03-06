import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../utils/api';

// ── Thunks ──────────────────────────────────────────────────────────────────

export const fetchOverview = createAsyncThunk('analytics/overview', async () => (await api.get('/admin/analytics/overview')).data.data);
export const fetchOrdersAnalytics = createAsyncThunk('analytics/orders', async (params) => (await api.get('/admin/analytics/orders', { params })).data.data);
export const fetchRevenueAnalytics = createAsyncThunk('analytics/revenue', async (params) => (await api.get('/admin/analytics/revenue', { params })).data.data);
export const fetchTopFarmers = createAsyncThunk('analytics/topFarmers', async (params) => (await api.get('/admin/analytics/top-farmers', { params })).data.data);
export const fetchTopProducts = createAsyncThunk('analytics/topProducts', async (params) => (await api.get('/admin/analytics/top-products', { params })).data.data);
export const fetchSubscriptionStats = createAsyncThunk('analytics/subscriptions', async () => (await api.get('/admin/analytics/subscriptions')).data.data);

// ── Helper: shared status handlers ──────────────────────────────────────────

const withStatus = (thunk, key) => (builder) => builder
    .addCase(thunk.pending, (s) => { s[key].status = 'loading'; })
    .addCase(thunk.fulfilled, (s, a) => { s[key].status = 'succeeded'; s[key].data = a.payload; })
    .addCase(thunk.rejected, (s, a) => { s[key].status = 'failed'; s[key].error = a.error.message; });

const makeInitial = () => ({ data: null, status: 'idle', error: null });

// ── Slice ────────────────────────────────────────────────────────────────────

const analyticsSlice = createSlice({
    name: 'analytics',
    initialState: {
        overview: makeInitial(),
        orders: makeInitial(),
        revenue: makeInitial(),
        topFarmers: makeInitial(),
        topProducts: makeInitial(),
        subscriptions: makeInitial(),
    },
    reducers: {},
    extraReducers: (builder) => {
        withStatus(fetchOverview, 'overview')(builder);
        withStatus(fetchOrdersAnalytics, 'orders')(builder);
        withStatus(fetchRevenueAnalytics, 'revenue')(builder);
        withStatus(fetchTopFarmers, 'topFarmers')(builder);
        withStatus(fetchTopProducts, 'topProducts')(builder);
        withStatus(fetchSubscriptionStats, 'subscriptions')(builder);
    }
});

export default analyticsSlice.reducer;
