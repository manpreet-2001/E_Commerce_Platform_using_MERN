import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './About.css';

const Returns = () => {
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
          <h1 className="about-title">Returns</h1>
          <p className="about-lead">
            Our return policy and how to request a return.
          </p>
          <section className="about-section">
            <h2>Return window</h2>
            <p>
              You may return most unused items within 30 days of delivery for a refund or exchange.
            </p>
          </section>
          <section className="about-section">
            <h2>How to return</h2>
            <p>
              Contact us via the <Link to="/contact">Contact</Link> page with your order number and reason. We’ll send you a return label and instructions.
            </p>
          </section>
          <section className="about-section">
            <h2>Refunds</h2>
            <p>
              Refunds are processed within 5–7 business days after we receive the item. The original payment method will be credited.
            </p>
          </section>
          <Link to="/products" className="about-cta">Continue shopping</Link>
        </div>
      </main>
    </div>
  );
};

export default Returns;
