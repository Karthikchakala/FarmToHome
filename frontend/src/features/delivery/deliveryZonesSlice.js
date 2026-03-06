import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchDeliveryZones = createAsyncThunk('deliveryZones/fetchAll', async () => {
    const response = await api.get('/delivery/zones');
    return response.data.data;
});

export const createDeliveryZone = createAsyncThunk('deliveryZones/create', async (zoneData) => {
    const response = await api.post('/admin/delivery-zones', zoneData);
    return response.data.data;
});

export const deleteDeliveryZone = createAsyncThunk('deliveryZones/delete', async (zoneId) => {
    await api.delete(`/admin/delivery-zones/${zoneId}`);
    return zoneId;
});

const deliveryZonesSlice = createSlice({
    name: 'deliveryZones',
    initialState: {
        zones: [],
        status: 'idle',
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDeliveryZones.pending, (state) => { state.status = 'loading'; })
            .addCase(fetchDeliveryZones.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.zones = action.payload;
            })
            .addCase(fetchDeliveryZones.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })
            .addCase(createDeliveryZone.fulfilled, (state, action) => {
                state.zones.unshift(action.payload);
            })
            .addCase(deleteDeliveryZone.fulfilled, (state, action) => {
                state.zones = state.zones.filter(z => z.id !== action.payload);
            });
    },
});

export default deliveryZonesSlice.reducer;
