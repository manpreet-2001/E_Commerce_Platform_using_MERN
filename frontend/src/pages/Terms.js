import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './About.css';

const Terms = () => (
  <div className="about-page">
    <Navbar />
    <main className="about-main">
      <div className="about-container">
        <h1 className="about-title">Terms of Service</h1>
        <p className="about-lead">
          Please read these terms before using CityTech Store.
        </p>

        <section className="about-section">
          <h2>Acceptance of terms</h2>
          <p>
            By creating an account, placing an order, or using this website, you agree to these Terms of Service
            and our Privacy Policy. If you do not agree, please do not use our services.
          </p>
        </section>

        <section className="about-section">
          <h2>Use of the service</h2>
          <p>
            You may use CityTech Store to browse products, create an account, place orders, and access
            order history. You must provide accurate information and keep your account secure. You may not
            use the site for any illegal purpose or to violate any applicable laws.
          </p>
        </section>

        <section className="about-section">
          <h2>Orders and payment</h2>
          <p>
            Orders are subject to availability and acceptance. We reserve the right to refuse or cancel orders.
            Payment terms (including Cash on Delivery or card) are as stated at checkout. Prices and
            promotions may change without notice.
          </p>
        </section>

        <section className="about-section">
          <h2>Returns and refunds</h2>
          <p>
            Our return and refund policy is described on the Returns page. By placing an order, you agree
            to that policy. Contact us for any questions about returns.
          </p>
        </section>

        <section className="about-section">
          <h2>Contact</h2>
          <p>
            For questions about these terms, visit our <Link to="/contact">Contact</Link> page.
          </p>
        </section>

        <p className="about-lead" style={{ marginTop: '2rem' }}>
          <Link to="/register">Back to registration</Link>
        </p>
      </div>
    </main>
    <Footer />
  </div>
);

export default Terms;
