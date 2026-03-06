import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchNotifications = createAsyncThunk('notifications/fetchAll', async () => {
    const response = await api.get('/notifications');
    return response.data.data;
});

export const markAsRead = createAsyncThunk('notifications/markAsRead', async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data.data;
});

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState: { items: [], unreadCount: 0, status: 'idle' },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
                state.unreadCount = action.payload.filter(n => !n.is_read).length;
            })
            .addCase(markAsRead.fulfilled, (state, action) => {
                const index = state.items.findIndex(n => n.id === action.payload.id);
                if (index !== -1 && !state.items[index].is_read) {
                    state.items[index].is_read = true;
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
            });
    }
});

export default notificationsSlice.reducer;
