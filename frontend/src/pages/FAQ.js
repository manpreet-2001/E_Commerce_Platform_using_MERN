import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './About.css';

const FAQ = () => {
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
          <h1 className="about-title">FAQ</h1>
          <p className="about-lead">
            Frequently asked questions about orders, shipping, and support.
          </p>
          <section className="about-section">
            <h2>How do I track my order?</h2>
            <p>
              Go to <Link to="/orders">My Orders</Link>, open your order, and use the tracking link in the confirmation email once it has shipped.
            </p>
          </section>
          <section className="about-section">
            <h2>What payment methods do you accept?</h2>
            <p>
              We accept card (debit/credit) and cash on delivery (COD) where available.
            </p>
          </section>
          <section className="about-section">
            <h2>How can I return an item?</h2>
            <p>
              See our <Link to="/returns">Returns</Link> page for the full policy and how to start a return.
            </p>
          </section>
          <section className="about-section">
            <h2>Who do I contact for help?</h2>
            <p>
              Use our <Link to="/contact">Contact</Link> page for questions about your order or account.
            </p>
          </section>
          <Link to="/products" className="about-cta">Continue shopping</Link>
        </div>
      </main>
    </div>
  );
};

export default FAQ;
