import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Navbar from './components/Navbar';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

// Guest Route - redirects to home if already logged in
const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  return isAuthenticated() ? <Navigate to="/" /> : children;
};

// Home Page Component
const HomePage = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="home-page">
      <Navbar />
      <div className="home-hero">
        <h1>Welcome to Local Store</h1>
        <p>Your trusted partner for quality products and services</p>
        {isAuthenticated() ? (
          <div className="user-welcome">
            <p className="welcome-text">Hello, {user?.name}!</p>
            <div className="hero-buttons">
              <a href="/dashboard" className="btn-primary">Go to Dashboard</a>
              <button type="button" onClick={handleLogout} className="btn-secondary">Logout</button>
            </div>
          </div>
        ) : (
          <div className="hero-buttons">
            <a href="/register" className="btn-primary">Get Started</a>
            <a href="/login" className="btn-secondary">Sign In</a>
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
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
          <Route path="/" element={<HomePage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
