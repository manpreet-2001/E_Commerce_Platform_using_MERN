import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => (
  <footer className="site-footer">
    <div className="site-footer-inner">
      <div className="site-footer-grid">
        <div className="site-footer-col">
          <h3 className="site-footer-heading">Shop</h3>
          <Link to="/products" className="site-footer-link">All Products</Link>
          <Link to="/products?category=phones" className="site-footer-link">Phones</Link>
          <Link to="/products?category=laptops" className="site-footer-link">Laptops</Link>
          <Link to="/products?category=electronics" className="site-footer-link">Electronics</Link>
        </div>
        <div className="site-footer-col">
          <h3 className="site-footer-heading">Support</h3>
          <Link to="/shipping" className="site-footer-link">Shipping Info</Link>
          <Link to="/returns" className="site-footer-link">Returns</Link>
          <Link to="/faq" className="site-footer-link">FAQ</Link>
        </div>
        <div className="site-footer-col">
          <h3 className="site-footer-heading">Company</h3>
          <Link to="/about" className="site-footer-link">About Us</Link>
          <Link to="/contact" className="site-footer-link">Contact</Link>
        </div>
      </div>
      <div className="site-footer-bottom">
        <p className="site-footer-text">© {new Date().getFullYear()} CityTech. Quality products, trusted service.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
