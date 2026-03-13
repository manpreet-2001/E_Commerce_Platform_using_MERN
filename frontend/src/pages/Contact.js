import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../context/AuthContext';
import './Contact.css';

const Contact = () => {
  const navigate = useNavigate();
  const { user, loading, hasRole } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user && hasRole(['admin'])) {
      navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
    } else if (user && hasRole(['vendor'])) {
      navigate(ROUTES.VENDOR_DASHBOARD, { replace: true });
    }
  }, [loading, user, hasRole, navigate]);

  if (user && (hasRole(['vendor']) || hasRole(['admin']))) {
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
              <Link to={ROUTES.PRODUCTS}>Shop products</Link> · <Link to={ROUTES.ABOUT}>About us</Link>
            </p>
          </section>

          <Link to={ROUTES.PRODUCTS} className="contact-cta">Continue shopping</Link>
        </div>
      </main>
    </div>
  );
};

export default Contact;
