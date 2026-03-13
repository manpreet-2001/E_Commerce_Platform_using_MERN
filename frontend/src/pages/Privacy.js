import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ROUTES } from '../constants/routes';
import Footer from '../components/Footer';
import './About.css';

const Privacy = () => (
  <div className="about-page">
    <Navbar />
    <main className="about-main">
      <div className="about-container">
        <h1 className="about-title">Privacy Policy</h1>
        <p className="about-lead">
          How CityTech Store collects, uses, and protects your information.
        </p>

        <section className="about-section">
          <h2>Information we collect</h2>
          <p>
            When you register, place an order, or contact us, we may collect your name, email address,
            shipping address, and payment-related information as needed to process orders and provide
            customer support.
          </p>
        </section>

        <section className="about-section">
          <h2>How we use your information</h2>
          <p>
            We use your information to process orders, send order and account-related emails (e.g. order
            confirmation, status updates), improve our service, and comply with legal obligations. We do
            not sell your personal information to third parties for marketing.
          </p>
        </section>

        <section className="about-section">
          <h2>Security</h2>
          <p>
            We take reasonable steps to protect your data, including secure connections and secure
            storage of account and order information. Passwords are stored in encrypted form.
          </p>
        </section>

        <section className="about-section">
          <h2>Cookies and usage data</h2>
          <p>
            We may use cookies and similar technologies to keep you signed in and to improve site
            functionality. You can adjust your browser settings to limit or block cookies.
          </p>
        </section>

        <section className="about-section">
          <h2>Contact</h2>
          <p>
            For privacy-related questions, visit our <Link to={ROUTES.CONTACT}>Contact</Link> page.
          </p>
        </section>

        <p className="about-lead" style={{ marginTop: '2rem' }}>
          <Link to={ROUTES.REGISTER} className="about-back-btn">← Back</Link>
        </p>
      </div>
    </main>
    <Footer />
  </div>
);

export default Privacy;
