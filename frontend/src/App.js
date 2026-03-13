import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { OrderNotificationProvider } from './context/OrderNotificationContext';
import { ReviewNotificationProvider } from './context/ReviewNotificationContext';
import { SocketProvider } from './context/SocketContext';
import { ROUTES, ROUTE_PATHS } from './constants/routes';
import VendorRoute from './components/VendorRoute';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Products from './pages/Products';
import HomePage from './pages/Home';
import Cart from './pages/Cart';
import './App.css';

const AdminGate = lazy(() => import('./components/AdminGate'));
const Register = lazy(() => import('./pages/Register'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Shipping = lazy(() => import('./pages/Shipping'));
const Returns = lazy(() => import('./pages/Returns'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const VendorDashboard = lazy(() => import('./pages/VendorDashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageFallback() {
  return (
    <div className="loading-screen" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div aria-hidden style={{ width: 32, height: 32, border: '3px solid #eee', borderTopColor: '#333', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

/** Redirects to home if already logged in (for login/register/forgot-password). */
const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }
  return isAuthenticated() ? <Navigate to={ROUTES.HOME} replace /> : children;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <SocketProvider>
            <OrderNotificationProvider>
              <ReviewNotificationProvider>
                <Router>
                <Suspense fallback={<PageFallback />}>
                <Routes>
                  {/* Public: shop & info */}
                  <Route path={ROUTES.PRODUCTS} element={<Products />} />
                  <Route path={ROUTE_PATHS.PRODUCT_DETAIL} element={<ProductDetail />} />
                  <Route path={ROUTES.ABOUT} element={<About />} />
                  <Route path={ROUTES.CONTACT} element={<Contact />} />
                  <Route path={ROUTES.SHIPPING} element={<Shipping />} />
                  <Route path={ROUTES.RETURNS} element={<Returns />} />
                  <Route path={ROUTES.FAQ} element={<FAQ />} />
                  <Route path={ROUTES.TERMS} element={<Terms />} />
                  <Route path={ROUTES.PRIVACY} element={<Privacy />} />
                  <Route path={ROUTES.CART} element={<Cart />} />

                  {/* Auth: guest only */}
                  <Route path={ROUTES.LOGIN} element={<GuestRoute><Login /></GuestRoute>} />
                  <Route path={ROUTES.REGISTER} element={<GuestRoute><Register /></GuestRoute>} />
                  <Route path={ROUTES.FORGOT_PASSWORD} element={<GuestRoute><ForgotPassword /></GuestRoute>} />
                  <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />

                  {/* Protected: requires login */}
                  <Route path={ROUTES.CHECKOUT} element={<PrivateRoute><Checkout /></PrivateRoute>} />
                  <Route path={ROUTES.ORDERS} element={<PrivateRoute><Orders /></PrivateRoute>} />
                  <Route path={ROUTE_PATHS.ORDER_DETAIL} element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
                  <Route path={ROUTES.WISHLIST} element={<PrivateRoute><Wishlist /></PrivateRoute>} />
                  <Route path={ROUTES.PROFILE} element={<PrivateRoute><Profile /></PrivateRoute>} />

                  {/* Role-based: /admin shows AdminLogin or AdminDashboard via AdminGate */}
                  <Route path={ROUTES.VENDOR_DASHBOARD} element={<VendorRoute><VendorDashboard /></VendorRoute>} />
                  <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminGate />} />

                  {/* Home & 404 (order matters: exact / last) */}
                  <Route path={ROUTES.HOME} element={<HomePage />} />
                  <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
                </Routes>
                </Suspense>
              </Router>
                </ReviewNotificationProvider>
              </OrderNotificationProvider>
            </SocketProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
  );
}

export default App;
