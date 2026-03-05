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

import ConsumerDashboard from './pages/consumer/Dashboard/Dashboard.jsx';

import FarmerLayout from './layouts/FarmerLayout/FarmerLayout.jsx';
import FarmerDashboard from './features/farmer/Dashboard/FarmerDashboard.jsx';
import FarmerProductsPage from './features/farmer/Products/FarmerProductsPage.jsx';
import AddProductPage from './features/farmer/Products/AddProductPage.jsx';
import EditProductPage from './features/farmer/Products/EditProductPage.jsx';
import FarmerOrdersPage from './features/farmer/Orders/FarmerOrdersPage.jsx';

import AdminDashboard from './pages/admin/Dashboard/Dashboard.jsx';

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

          {/* Farmer Protected Routes */}
          <Route path="/farmer" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<FarmerDashboard />} />
            <Route path="products" element={<FarmerProductsPage />} />
            <Route path="products/new" element={<AddProductPage />} />
            <Route path="products/edit/:productId" element={<EditProductPage />} />
            <Route path="orders" element={<FarmerOrdersPage />} />
            <Route path="profile" element={<div style={{ padding: '32px' }}>Profile Page Coming Soon...</div>} />
          </Route>

          {/* Admin Protected Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </Router>
  );
};

export default App;
