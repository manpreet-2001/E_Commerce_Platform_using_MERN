import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <div className="home-page">
            <Navbar />
            <div className="home-hero">
              <h1>Welcome to Local Store</h1>
              <p>Your trusted partner for quality products and services</p>
              <div className="hero-buttons">
                <a href="/register" className="btn-primary">Get Started</a>
                <a href="/login" className="btn-secondary">Sign In</a>
              </div>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
