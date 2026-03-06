import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MainLayout from './layouts/MainLayout/MainLayout.jsx';
import { Login, Register } from './features/auth';
import ForgotPassword from './features/auth/ForgotPassword/ForgotPassword.jsx';
import Home from './pages/Home/Home.jsx';
import ConsumerProducts from './pages/consumer/Products/Products.jsx';
import CartPage from './features/consumer/cart/CartPage.jsx';
import CheckoutPage from './features/consumer/cart/CheckoutPage.jsx';
import OrdersPage from './features/consumer/orders/OrdersPage.jsx';
import OrderDetailsPage from './features/consumer/orders/OrderDetailsPage.jsx';
<<<<<<< HEAD
import SubscriptionsPage from './pages/consumer/SubscriptionsPage.jsx';
import CreateSubscriptionPage from './pages/consumer/CreateSubscriptionPage.jsx';
import SubscriptionDetailsPage from './pages/consumer/SubscriptionDetailsPage.jsx';
=======
>>>>>>> 13e0d502b1d3468218cb5ebbe8d706910030bec4

import ConsumerDashboard from './pages/consumer/Dashboard/Dashboard.jsx';

import FarmerLayout from './layouts/FarmerLayout/FarmerLayout.jsx';
import FarmerDashboard from './features/farmer/Dashboard/FarmerDashboard.jsx';
import FarmerProductsPage from './features/farmer/Products/FarmerProductsPage.jsx';
import AddProductPage from './features/farmer/Products/AddProductPage.jsx';
import EditProductPage from './features/farmer/Products/EditProductPage.jsx';
import FarmerOrdersPage from './features/farmer/Orders/FarmerOrdersPage.jsx';

<<<<<<< HEAD
import SelectLocationPage from './pages/consumer/SelectLocationPage.jsx';
import DeliveryAddressPage from './pages/consumer/DeliveryAddressPage.jsx';

import PaymentPage from './pages/consumer/PaymentPage.jsx';
import PaymentSuccessPage from './pages/consumer/PaymentSuccessPage.jsx';
import PaymentFailurePage from './pages/consumer/PaymentFailurePage.jsx';

import AdminLayout from './layouts/AdminLayout/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import FarmersManagementPage from './pages/admin/FarmersManagementPage.jsx';
import ConsumersManagementPage from './pages/admin/ConsumersManagementPage.jsx';
import OrdersManagementPage from './pages/admin/OrdersManagementPage.jsx';
import AnalyticsPage from './pages/admin/AnalyticsPage.jsx';
import FeedbackPage from './pages/admin/FeedbackPage.jsx';
import PriceControlPage from './pages/admin/PriceControlPage.jsx';
import PlatformAnalyticsPage from './pages/admin/PlatformAnalyticsPage.jsx';
import OrdersAnalyticsPage from './pages/admin/OrdersAnalyticsPage.jsx';
import RevenueAnalyticsPage from './pages/admin/RevenueAnalyticsPage.jsx';
import TopFarmersPage from './pages/admin/TopFarmersPage.jsx';
import TopProductsPage from './pages/admin/TopProductsPage.jsx';
import SubscriptionAnalyticsPage from './pages/admin/SubscriptionAnalyticsPage.jsx';
import DeliveryZonesPage from './pages/admin/DeliveryZonesPage.jsx';
import NotificationsPage from './pages/notifications/NotificationsPage.jsx';
=======
import AdminDashboard from './pages/admin/Dashboard/Dashboard.jsx';
>>>>>>> 13e0d502b1d3468218cb5ebbe8d706910030bec4

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useSelector(state => state.auth);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;

  return children;
};

const App = () => {
  return (
    <Router>
      <MainLayout>
        <Routes>
          {/* Public / Generic Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ConsumerProducts />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Consumer Protected Routes */}
          <Route path="/cart" element={
            <ProtectedRoute allowedRoles={['consumer']}><CartPage /></ProtectedRoute>
          } />
          <Route path="/checkout" element={
            <ProtectedRoute allowedRoles={['consumer']}><CheckoutPage /></ProtectedRoute>
          } />
          <Route path="/consumer/dashboard" element={
            <ProtectedRoute allowedRoles={['consumer']}><ConsumerDashboard /></ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute allowedRoles={['consumer']}><OrdersPage /></ProtectedRoute>
          } />
          <Route path="/orders/:orderId" element={
            <ProtectedRoute allowedRoles={['consumer']}><OrderDetailsPage /></ProtectedRoute>
          } />
<<<<<<< HEAD
          <Route path="/subscriptions" element={
            <ProtectedRoute allowedRoles={['consumer']}><SubscriptionsPage /></ProtectedRoute>
          } />
          <Route path="/subscriptions/new" element={
            <ProtectedRoute allowedRoles={['consumer']}><CreateSubscriptionPage /></ProtectedRoute>
          } />
          <Route path="/subscriptions/:subscriptionId" element={
            <ProtectedRoute allowedRoles={['consumer']}><SubscriptionDetailsPage /></ProtectedRoute>
          } />

          {/* Delivery Routes */}
          <Route path="/select-location" element={
            <ProtectedRoute allowedRoles={['consumer']}><SelectLocationPage /></ProtectedRoute>
          } />
          <Route path="/delivery-address" element={
            <ProtectedRoute allowedRoles={['consumer']}><DeliveryAddressPage /></ProtectedRoute>
          } />

          {/* Payment Routes */}
          <Route path="/payment/success" element={
            <ProtectedRoute allowedRoles={['consumer']}><PaymentSuccessPage /></ProtectedRoute>
          } />
          <Route path="/payment/failed" element={
            <ProtectedRoute allowedRoles={['consumer']}><PaymentFailurePage /></ProtectedRoute>
          } />
          <Route path="/payment/:orderId" element={
            <ProtectedRoute allowedRoles={['consumer']}><PaymentPage /></ProtectedRoute>
          } />
=======
>>>>>>> 13e0d502b1d3468218cb5ebbe8d706910030bec4

          {/* Farmer Protected Routes */}
          <Route path="/farmer" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<FarmerDashboard />} />
            <Route path="products" element={<FarmerProductsPage />} />
            <Route path="products/new" element={<AddProductPage />} />
            <Route path="products/edit/:productId" element={<EditProductPage />} />
            <Route path="orders" element={<FarmerOrdersPage />} />
            <Route path="profile" element={<div style={{ padding: '32px' }}>Profile Page Coming Soon...</div>} />
          </Route>

<<<<<<< HEAD
          {/* Admin Protected Routes - Nested under AdminLayout */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="farmers" element={<FarmersManagementPage />} />
            <Route path="consumers" element={<ConsumersManagementPage />} />
            <Route path="orders" element={<OrdersManagementPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="price-control" element={<PriceControlPage />} />
            {/* Analytics sub-routes */}
            <Route path="analytics" element={<PlatformAnalyticsPage />} />
            <Route path="analytics/orders" element={<OrdersAnalyticsPage />} />
            <Route path="analytics/revenue" element={<RevenueAnalyticsPage />} />
            <Route path="analytics/top-farmers" element={<TopFarmersPage />} />
            <Route path="analytics/top-products" element={<TopProductsPage />} />
            <Route path="analytics/subscriptions" element={<SubscriptionAnalyticsPage />} />

            <Route path="delivery-zones" element={<DeliveryZonesPage />} />
          </Route>

          {/* Notifications - All authenticated users */}
          <Route path="/notifications" element={
            <ProtectedRoute allowedRoles={['consumer', 'farmer', 'admin']}><NotificationsPage /></ProtectedRoute>
=======
          {/* Admin Protected Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
>>>>>>> 13e0d502b1d3468218cb5ebbe8d706910030bec4
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </Router>
  );
};

export default App;
