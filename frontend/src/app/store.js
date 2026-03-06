import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice.js';
import cartReducer from '../features/consumer/cart/cartSlice.js';

import farmerDashboardReducer from '../features/farmer/Dashboard/farmerDashboardSlice.js';
import farmerProductsReducer from '../features/farmer/Products/farmerProductsSlice.js';
import farmerOrdersReducer from '../features/farmer/Orders/farmerOrdersSlice.js';
import ordersReducer from '../features/consumer/orders/ordersSlice.js';
<<<<<<< HEAD
import { adminReducers } from '../features/admin/adminSlices.js';
import notificationsReducer from '../features/notifications/notificationsSlice.js';
import subscriptionsReducer from '../features/subscriptions/subscriptionsSlice.js';
import analyticsReducer from '../features/admin/analytics/analyticsSlice.js';
import userLocationReducer from '../features/delivery/userLocationSlice.js';
import deliveryZonesReducer from '../features/delivery/deliveryZonesSlice.js';
import deliveryAddressReducer from '../features/delivery/deliveryAddressSlice.js';
import paymentsReducer from '../features/payments/paymentsSlice.js';
=======
>>>>>>> 13e0d502b1d3468218cb5ebbe8d706910030bec4

export const store = configureStore({
    reducer: {
        auth: authReducer,
        cart: cartReducer,
        farmerDashboard: farmerDashboardReducer,
        farmerProducts: farmerProductsReducer,
        farmerOrders: farmerOrdersReducer,
        orders: ordersReducer,
<<<<<<< HEAD
        ...adminReducers,
        notifications: notificationsReducer,
        subscriptions: subscriptionsReducer,
        analytics: analyticsReducer,
        userLocation: userLocationReducer,
        deliveryZones: deliveryZonesReducer,
        deliveryAddress: deliveryAddressReducer,
        payments: paymentsReducer
=======
>>>>>>> 13e0d502b1d3468218cb5ebbe8d706910030bec4
    },
});
