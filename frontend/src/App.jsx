import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
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
import Notifications from './pages/farmer/Notifications'
import ProductReviews from './pages/farmer/ProductReviews'
import ProductManagement from './pages/farmer/ProductManagement'
import StockManagement from './pages/farmer/StockManagement'
import OrderManagement from './pages/farmer/OrderManagement'
import FarmerOrders from './pages/farmer/FarmerOrders'
import SubscriptionManagement from './pages/farmer/SubscriptionManagement'
import FarmerCostChart from './pages/farmer/FarmerCostChart'
import ReviewManagement from './pages/farmer/ReviewManagement'
import Settings from './pages/farmer/Settings'
import Simulator from './pages/farmer/Simulator'
import Subscriptions from './pages/customer/Subscriptions'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import AdminDashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import AdminOrderManagement from './pages/admin/OrderManagement'
import AdminProductManagement from './pages/admin/ProductManagement'
import FarmerManagement from './pages/admin/FarmerManagement'
import AdminAnalytics from './pages/admin/Analytics'
import FeedbackManagement from './pages/admin/FeedbackManagement'
import AdminSettings from './pages/admin/Settings'
import CostChartManagement from './components/admin/CostChartManagement'
import CustomerReviews from './pages/customer/Reviews'
import CustomerFeedback from './pages/customer/CustomerFeedback'
import AdminFeedback from './pages/admin/AdminFeedback'
import AIAssistant from './pages/ai-assistant'
import PestScanner from './pages/pest-scanner'
import YieldPredictor from './pages/yield-predictor'
import ClimateSimulator from './pages/climate-simulator'
import CropSimulator from './pages/crop-simulator'
import CropMonetizer from './pages/crop-monetizer'
import FieldManagement from './pages/field-management'
import TalkToExperts from './pages/talk-to-experts'
import CropWiki from './pages/farmer/CropWiki'
import CropWikiDetail from './pages/farmer/CropWikiDetail'
import FarmingPractices from './pages/farmer/FarmingPractices'
import FarmingPracticesDetail from './pages/farmer/FarmingPracticesDetail'
import FloatingChatbot from './components/FloatingChatbot'
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
          toggleSidebar={toggleSidebar}
          location={location}
        />
      </AuthProvider>
    </HelmetProvider>
  )
}

// Separate component that has access to auth context
function AppContent({ toggleSidebar, location }) {
  const { user, loading } = useAuth()
  const hideFooterOnRoutes = [
    '/ai-assistant',
    '/farmer/ai-assistant',
    '/farmer/crop-wiki',
    '/farmer/farming-practices',
    '/farmer/crop-simulator',
    '/farmer/climate-simulator'
  ]
  const hideFooter = hideFooterOnRoutes.some((route) => location.pathname.startsWith(route))
  const assistantElement = user?.role === 'farmer' ? <AIAssistant /> : <Navigate to="/login" replace />

  if (loading) {
    return (
      <div className="app">
        <Navbar location={location} user={user} toggleSidebar={toggleSidebar} />
        <main className="main" />
      </div>
    )
  }

  return (
    <div className="app">
      <Navbar location={location} user={user} toggleSidebar={toggleSidebar} />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Navigate to="/customer/checkout" replace />} />
          <Route path="/customer/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Navigate to="/customer/orders" replace />} />
          <Route path="/customer/orders" element={<Orders />} />
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
          <Route path="/customer/feedback" element={<CustomerFeedback />} />
          <Route path="/customer/cart" element={<Cart />} />
          <Route path="/customer/checkout" element={<Checkout />} />
          <Route path="/customer/order-success" element={<OrderSuccess />} />
          
          {/* Admin Routes - Protected by role check in components */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/orders" element={<AdminOrderManagement />} />
          <Route path="/admin/products" element={<AdminProductManagement />} />
          <Route path="/admin/farmers" element={<FarmerManagement />} />
          <Route path="/admin/cost-chart" element={<CostChartManagement />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/feedback" element={<AdminFeedback />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/ai-assistant" element={assistantElement} />
          <Route path="/farmer/ai-assistant" element={assistantElement} />
          
          {/* Farmer Routes */}
          {user?.role === 'farmer' && (
            <>
              <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
              <Route path="/farmer/notifications" element={<Notifications />} />
              <Route path="/farmer/products" element={<ProductManagement />} />
              <Route path="/farmer/products/add" element={<ProductManagement />} />
              <Route path="/farmer/products/new" element={<ProductManagement />} />
              <Route path="/farmer/products/:id/reviews" element={<ProductReviews />} />
              <Route path="/farmer/products/edit/:id" element={<ProductManagement />} />
              <Route path="/farmer/stock" element={<StockManagement />} />
              <Route path="/farmer/orders" element={<FarmerOrders />} />
              <Route path="/farmer/orders/pending" element={<FarmerOrders />} />
              <Route path="/farmer/subscriptions" element={<SubscriptionManagement />} />
              <Route path="/farmer/cost-chart" element={<FarmerCostChart />} />
              <Route path="/farmer/reviews" element={<ReviewManagement />} />
              <Route path="/farmer/profile" element={<FarmerProfile />} />
              <Route path="/farmer/settings" element={<Settings />} />
              <Route path="/farmer/simulator" element={<Simulator />} />
              <Route path="/farmer/pest-scanner" element={<PestScanner />} />
              <Route path="/farmer/yield-predictor" element={<YieldPredictor />} />
              <Route path="/farmer/crop-wiki" element={<CropWiki />} />
              <Route path="/farmer/crop-wiki/:slug" element={<CropWikiDetail />} />
              <Route path="/farmer/farming-practices" element={<FarmingPractices />} />
              <Route path="/farmer/farming-practices/:slug" element={<FarmingPracticesDetail />} />
              <Route path="/farmer/crop-simulator" element={<CropSimulator />} />
              <Route path="/farmer/climate-simulator" element={<ClimateSimulator />} />
              <Route path="/farmer/crop-monetizer" element={<CropMonetizer />} />
              <Route path="/farmer/field-management" element={<FieldManagement />} />
              <Route path="/farmer/talk-to-experts" element={<TalkToExperts />} />
            </>
          )}
          
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </main>
      <FloatingChatbot />
      {!hideFooter && <Footer />}
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  )
}

export default App
