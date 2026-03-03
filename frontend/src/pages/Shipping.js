import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './About.css';

const Shipping = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user && (user.role === 'vendor' || user.role === 'admin')) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, user, navigate]);

  if (user && (user.role === 'vendor' || user.role === 'admin')) {
    return null;
  }

  return (
    <div className="about-page">
      <Navbar />
      <main className="about-main">
        <div className="about-container">
          <h1 className="about-title">Shipping Info</h1>
          <p className="about-lead">
            How we ship your orders and what to expect.
          </p>
          <section className="about-section">
            <h2>Delivery times</h2>
            <p>
              Standard delivery: 5–7 business days. Express options may be available at checkout.
            </p>
          </section>
          <section className="about-section">
            <h2>Free shipping</h2>
            <p>
              Orders over $50 qualify for free standard shipping. We ship to the address you provide at checkout.
            </p>
          </section>
          <section className="about-section">
            <h2>Tracking</h2>
            <p>
              Once your order ships, you’ll receive an email with a tracking link. You can also check status in <Link to="/orders">My Orders</Link>.
            </p>
          </section>
          <Link to="/products" className="about-cta">Continue shopping</Link>
        </div>
      </main>
    </div>
  );
};

export default Shipping;
