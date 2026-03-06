import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// ── Thunks ──────────────────────────────────────────────────────────────────

export const fetchSubscriptions = createAsyncThunk(
    'subscriptions/fetchAll',
    async (_unused, { rejectWithValue: _rejectWithValue }) => {
        const res = await api.get('/subscriptions');
        return res.data.data;
    }
);

export const fetchSubscriptionDetails = createAsyncThunk(
    'subscriptions/fetchOne',
    async (id, { rejectWithValue: _rejectWithValue }) => {
        const res = await api.get(`/subscriptions/${id}`);
        return res.data.data;
    }
);

export const createSubscription = createAsyncThunk(
    'subscriptions/create',
    async (payload, { rejectWithValue }) => {
        try {
            const res = await api.post('/subscriptions', payload);
            return res.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to create subscription');
        }
    }
);

export const pauseSubscription = createAsyncThunk(
    'subscriptions/pause',
    async (id) => {
        const res = await api.put(`/subscriptions/${id}/pause`);
        return res.data.data;
    }
);

export const resumeSubscription = createAsyncThunk(
    'subscriptions/resume',
    async (id) => {
        const res = await api.put(`/subscriptions/${id}/resume`);
        return res.data.data;
    }
);

export const cancelSubscription = createAsyncThunk(
    'subscriptions/cancel',
    async (id) => {
        const res = await api.delete(`/subscriptions/${id}`);
        return { id, ...res.data.data };
    }
);

// ── Slice ────────────────────────────────────────────────────────────────────

const subscriptionsSlice = createSlice({
    name: 'subscriptions',
    initialState: {
        items: [],
        selected: null,
        status: 'idle',
        error: null,
        createStatus: 'idle',
        createError: null
    },
    reducers: {
        clearCreateStatus(state) {
            state.createStatus = 'idle';
            state.createError = null;
        }
    },
    extraReducers: (builder) => {
        // Fetch all
        builder
            .addCase(fetchSubscriptions.pending, (s) => { s.status = 'loading'; })
            .addCase(fetchSubscriptions.fulfilled, (s, a) => { s.status = 'succeeded'; s.items = a.payload; })
            .addCase(fetchSubscriptions.rejected, (s, a) => { s.status = 'failed'; s.error = a.error.message; });

        // Fetch one
        builder
            .addCase(fetchSubscriptionDetails.pending, (s) => { s.status = 'loading'; })
            .addCase(fetchSubscriptionDetails.fulfilled, (s, a) => { s.status = 'succeeded'; s.selected = a.payload; })
            .addCase(fetchSubscriptionDetails.rejected, (s, a) => { s.status = 'failed'; s.error = a.error.message; });

        // Create
        builder
            .addCase(createSubscription.pending, (s) => { s.createStatus = 'loading'; })
            .addCase(createSubscription.fulfilled, (s, a) => {
                s.createStatus = 'succeeded';
                if (Array.isArray(a.payload)) s.items = [...s.items, ...a.payload];
            })
            .addCase(createSubscription.rejected, (s, a) => { s.createStatus = 'failed'; s.createError = a.payload; });

        // Update status helpers — mutate item in list
        const updateItem = (state, updatedItem) => {
            const idx = state.items.findIndex(i => i.id === updatedItem.id);
            if (idx !== -1) state.items[idx] = { ...state.items[idx], ...updatedItem };
            if (state.selected?.id === updatedItem.id) state.selected = { ...state.selected, ...updatedItem };
        };
        builder
            .addCase(pauseSubscription.fulfilled, (s, a) => updateItem(s, a.payload))
            .addCase(resumeSubscription.fulfilled, (s, a) => updateItem(s, a.payload))
            .addCase(cancelSubscription.fulfilled, (s, a) => updateItem(s, a.payload));
    }
});

export const { clearCreateStatus } = subscriptionsSlice.actions;
export default subscriptionsSlice.reducer;
