import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import VendorRoute from './components/VendorRoute';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import HomePage from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import VendorDashboard from './pages/VendorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

// Guest Route - redirects to home if already logged in
const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  return isAuthenticated() ? <Navigate to="/" /> : children;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
        <Router>
          <Routes>
            <Route path="/login" element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            } />
            <Route path="/register" element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            } />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={
              <PrivateRoute>
                <Wishlist />
              </PrivateRoute>
            } />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/dashboard" element={
              <VendorRoute>
                <VendorDashboard />
              </VendorRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/" element={<HomePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        </WishlistProvider>
        </CartProvider>
    </AuthProvider>
  );
}

export default App;
