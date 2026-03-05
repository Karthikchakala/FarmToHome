import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice.js';
import cartReducer from '../features/consumer/cart/cartSlice.js';

import farmerDashboardReducer from '../features/farmer/Dashboard/farmerDashboardSlice.js';
import farmerProductsReducer from '../features/farmer/Products/farmerProductsSlice.js';
import farmerOrdersReducer from '../features/farmer/Orders/farmerOrdersSlice.js';
import ordersReducer from '../features/consumer/orders/ordersSlice.js';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        cart: cartReducer,
        farmerDashboard: farmerDashboardReducer,
        farmerProducts: farmerProductsReducer,
        farmerOrders: farmerOrdersReducer,
        orders: ordersReducer,
    },
});
