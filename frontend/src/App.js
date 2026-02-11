import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import PrivateRoute from './components/PrivateRoute';
import VendorRoute from './components/VendorRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import HomePage from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Cart from './pages/Cart';
import VendorDashboard from './pages/VendorDashboard';
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
            <Route path="/dashboard" element={
              <VendorRoute>
                <VendorDashboard />
              </VendorRoute>
            } />
            <Route path="/" element={<HomePage />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
