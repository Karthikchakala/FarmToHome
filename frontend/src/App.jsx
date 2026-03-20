import { Routes, Route, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { useState, useContext, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Footer from './components/Footer'
import FarmerNavbar from './components/FarmerNavbar'
import CustomerNavbar from './components/CustomerNavbar'
import AdminNavbar from './components/AdminNavbar'
import Home from './pages/Home'
import About from './pages/shared/About'
import Services from './pages/shared/Services'
import Contact from './pages/shared/Contact'
import Products from './pages/products/Products'
import ProductDetails from './pages/products/ProductDetails'
import Cart from './pages/customer/Cart'
import Checkout from './pages/orders/Checkout'
import Orders from './pages/customer/Orders'
import OrderSuccess from './pages/orders/OrderSuccess'
import Chat from './pages/communications/Chat'
import CustomerProfile from './pages/customer/CustomerProfile'
import CustomerDashboard from './pages/customer/CustomerDashboard'
import CustomerProducts from './pages/customer/CustomerProducts'
import FarmerProfile from './pages/farmer/FarmerProfile'
import FarmerDashboard from './pages/farmer/FarmerDashboard'
import ProductManagement from './pages/farmer/ProductManagement'
import StockManagement from './pages/farmer/StockManagement'
import OrderManagement from './pages/farmer/OrderManagement'
import SubscriptionManagement from './pages/farmer/SubscriptionManagement'
import ReviewManagement from './pages/farmer/ReviewManagement'
import Analytics from './pages/farmer/Analytics'
import Settings from './pages/farmer/Settings'
import Subscriptions from './pages/customer/Subscriptions'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import AdminDashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import AdminOrderManagement from './pages/admin/OrderManagement'
import AdminProductManagement from './pages/admin/ProductManagement'
import FarmerManagement from './pages/admin/FarmerManagement'
import AdminAnalytics from './pages/admin/Analytics'
import AdminSettings from './pages/admin/Settings'
import CustomerReviews from './pages/customer/Reviews'
import './styles/global.css'
import './App.css'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <HelmetProvider>
      <AuthProvider>
        <AppContent 
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          location={location}
        />
      </AuthProvider>
    </HelmetProvider>
  )
}

// Separate component that has access to auth context
function AppContent({ isSidebarOpen, toggleSidebar, location }) {
  const { user } = useAuth()

  // Role-based navbar selection
  const getNavbar = () => {
    if (user?.role === 'farmer') {
      return <FarmerNavbar />
    } else if (user?.role === 'admin') {
      return <AdminNavbar />
    } else {
      return <CustomerNavbar toggleSidebar={toggleSidebar} showSidebarToggle={true} />
    }
  }

  return (
    <div className="app">
      {getNavbar()}
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/chat" element={<Chat />} />
          
          {/* Customer Routes */}
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/products" element={<CustomerProducts />} />
          <Route path="/customer/product/:id" element={<ProductDetails />} />
          <Route path="/customer/profile" element={<CustomerProfile />} />
          <Route path="/customer/orders" element={<Orders />} />
          <Route path="/customer/subscriptions" element={<Subscriptions />} />
          <Route path="/customer/reviews" element={<CustomerReviews />} />
          <Route path="/customer/cart" element={<Cart />} />
          <Route path="/customer/checkout" element={<Checkout />} />
          <Route path="/customer/order-success" element={<OrderSuccess />} />
          
          {/* Admin Routes - Protected by role check in components */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/orders" element={<AdminOrderManagement />} />
          <Route path="/admin/products" element={<AdminProductManagement />} />
          <Route path="/admin/farmers" element={<FarmerManagement />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          
          {/* Farmer Routes */}
          {user?.role === 'farmer' && (
            <>
              <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
              <Route path="/farmer/products" element={<ProductManagement />} />
              <Route path="/farmer/products/add" element={<ProductManagement />} />
              <Route path="/farmer/products/new" element={<ProductManagement />} />
              <Route path="/farmer/products/edit/:id" element={<ProductManagement />} />
              <Route path="/farmer/stock" element={<StockManagement />} />
              <Route path="/farmer/orders" element={<OrderManagement />} />
              <Route path="/farmer/orders/pending" element={<OrderManagement />} />
              <Route path="/farmer/subscriptions" element={<SubscriptionManagement />} />
              <Route path="/farmer/reviews" element={<ReviewManagement />} />
              <Route path="/farmer/profile" element={<FarmerProfile />} />
              <Route path="/farmer/analytics" element={<Analytics />} />
              <Route path="/farmer/settings" element={<Settings />} />
            </>
          )}
          
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
