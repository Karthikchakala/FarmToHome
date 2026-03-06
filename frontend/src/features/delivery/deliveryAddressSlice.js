import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const saveAddress = createAsyncThunk('deliveryAddress/save', async (addressData) => {
    const response = await api.post('/consumer/address', addressData);
    return response.data.data;
});

const deliveryAddressSlice = createSlice({
    name: 'deliveryAddress',
    initialState: {
        currentAddress: null,
        status: 'idle',
        error: null,
    },
    reducers: {
        setLocalAddress: (state, action) => {
            state.currentAddress = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(saveAddress.pending, (state) => { state.status = 'loading'; })
            .addCase(saveAddress.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.currentAddress = action.payload;
            })
            .addCase(saveAddress.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            });
    },
});

export const { setLocalAddress } = deliveryAddressSlice.actions;
export default deliveryAddressSlice.reducer;
