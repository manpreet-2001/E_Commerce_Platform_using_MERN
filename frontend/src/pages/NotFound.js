import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './NotFound.css';

const NotFound = () => (
  <div className="not-found-page">
    <Navbar />
    <main className="not-found-main">
      <div className="not-found-content">
        <h1 className="not-found-title">404</h1>
        <p className="not-found-text">Page not found</p>
        <p className="not-found-subtext">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="not-found-link">Back to Home</Link>
        <Link to="/products" className="not-found-link not-found-link-secondary">Browse Shop</Link>
      </div>
    </main>
  </div>
);

export default NotFound;
