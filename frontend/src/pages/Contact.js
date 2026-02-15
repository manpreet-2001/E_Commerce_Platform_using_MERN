import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './Contact.css';

const Contact = () => {
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
    <div className="contact-page">
      <Navbar />

      <main className="contact-main">
        <div className="contact-container">
          <h1 className="contact-title">Contact Us</h1>
          <p className="contact-lead">
            Have a question or feedback? We’d love to hear from you.
          </p>

          <section className="contact-section">
            <h2>Get in touch</h2>
            <ul className="contact-info">
              <li>
                <strong>Email:</strong>{' '}
                <a href="mailto:support@citytech.com">support@citytech.com</a>
              </li>
              <li>
                <strong>Phone:</strong> +1 (555) 123-4567
              </li>
              <li>
                <strong>Hours:</strong> Mon–Fri 9am–6pm EST
              </li>
            </ul>
          </section>

          <section className="contact-section">
            <h2>Quick links</h2>
            <p>
              <Link to="/products">Shop products</Link> · <Link to="/about">About us</Link>
            </p>
          </section>

          <Link to="/products" className="contact-cta">Continue shopping</Link>
        </div>
      </main>
    </div>
  );
};

export default Contact;
