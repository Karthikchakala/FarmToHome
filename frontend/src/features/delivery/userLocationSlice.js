import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    latitude: null,
    longitude: null,
    address: '',
    isAutoDetected: false,
};

const userLocationSlice = createSlice({
    name: 'userLocation',
    initialState,
    reducers: {
        setLocation: (state, action) => {
            state.latitude = action.payload.latitude;
            state.longitude = action.payload.longitude;
            state.address = action.payload.address || state.address;
            state.isAutoDetected = action.payload.isAutoDetected || false;
        },
        clearLocation: () => initialState,
    },
});

export const { setLocation, clearLocation } = userLocationSlice.actions;
export default userLocationSlice.reducer;
