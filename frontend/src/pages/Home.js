import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './Home.css';

const HomePage = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const features = [
    {
      icon: '🚚',
      title: 'Free Shipping',
      text: 'On orders over $50'
    },
    {
      icon: '🔒',
      title: 'Secure Payment',
      text: '100% protected checkout'
    },
    {
      icon: '✨',
      title: 'Quality Products',
      text: 'Curated for you'
    },
    {
      icon: '💬',
      title: '24/7 Support',
      text: 'We\'re here to help'
    }
  ];

  return (
    <div className="home-page">
      <Navbar />

      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-bg" aria-hidden="true" />
        <div className="home-hero-content">
          <p className="home-hero-badge">Your trusted store</p>
          <h1 className="home-hero-title">
            Welcome to <span className="home-hero-brand">Local Store</span>
          </h1>
          <p className="home-hero-subtitle">
            Quality electronics and accessories, delivered with care. Shop smart, shop local.
          </p>
          {isAuthenticated() ? (
            <div className="home-hero-actions">
              <p className="home-hero-greeting">Hello, {user?.name}!</p>
              <div className="home-hero-buttons">
                <Link to="/products" className="btn-hero btn-hero-primary">Shop Products</Link>
                <button type="button" onClick={handleLogout} className="btn-hero btn-hero-secondary">Logout</button>
              </div>
            </div>
          ) : (
            <div className="home-hero-buttons">
              <Link to="/register" className="btn-hero btn-hero-primary">Get Started</Link>
              <Link to="/login" className="btn-hero btn-hero-secondary">Sign In</Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Strip */}
      <section className="home-features">
        <div className="home-features-inner">
          {features.map((item) => (
            <div key={item.title} className="home-feature">
              <span className="home-feature-icon">{item.icon}</span>
              <div className="home-feature-text">
                <h3 className="home-feature-title">{item.title}</h3>
                <p className="home-feature-desc">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="home-cta">
        <div className="home-cta-inner">
          <h2 className="home-cta-title">Ready to explore?</h2>
          <p className="home-cta-text">Browse our collection of electronics, phones, laptops, and more.</p>
          <Link to="/products" className="btn-cta">View All Products</Link>
        </div>
      </section>

      {/* Footer strip */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <p className="home-footer-text">© Local Store — Quality products, trusted service.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
