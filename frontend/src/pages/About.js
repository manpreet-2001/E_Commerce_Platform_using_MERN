import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <Navbar />

      <main className="about-main">
        <div className="about-container">
          <h1 className="about-title">About CityTech</h1>
          <p className="about-lead">
            Your trusted source for quality electronics and accessories.
          </p>

          <section className="about-section">
            <h2>Who we are</h2>
            <p>
              CityTech is an e-commerce platform built to bring you the latest in phones, laptops,
              electronics, and accessories. We focus on quality products, fair prices, and a
              smooth shopping experience.
            </p>
          </section>

          <section className="about-section">
            <h2>What we offer</h2>
            <ul className="about-list">
              <li>Wide range of electronics and gadgets</li>
              <li>Secure checkout and easy returns</li>
              <li>Free shipping on orders over $50</li>
              <li>Responsive customer support</li>
            </ul>
          </section>

          <section className="about-section">
            <h2>Get in touch</h2>
            <p>
              Have questions? Visit our <Link to="/contact">Contact</Link> page or browse our{' '}
              <Link to="/products">products</Link> to start shopping.
            </p>
          </section>

          <Link to="/products" className="about-cta">Shop now</Link>
        </div>
      </main>
    </div>
  );
};

export default About;
