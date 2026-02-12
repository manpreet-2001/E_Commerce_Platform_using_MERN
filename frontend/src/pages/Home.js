import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Home.css';

const HERO_SLIDES = [
  {
    id: 'phones',
    badge: 'New arrivals',
    title: 'Smartphones & accessories',
    subtitle: 'Latest phones and gear. Free shipping on orders over $50.',
    cta: 'Shop Phones',
    to: '/products?category=phones',
    theme: 'phones', // for CSS gradient
  },
  {
    id: 'laptops',
    badge: 'Electronics',
    title: 'Laptops & workstations',
    subtitle: 'Powerful devices for work and play. Quality guaranteed.',
    cta: 'Shop Laptops',
    to: '/products?category=laptops',
    theme: 'laptops',
  },
  {
    id: 'sale',
    badge: 'Limited time',
    title: 'Deals on electronics',
    subtitle: 'Save on top brands. Shop the best offers at CityTech.',
    cta: 'View all deals',
    to: '/products',
    theme: 'sale',
  },
];

const SLIDE_INTERVAL_MS = 5000;

const HomePage = () => {
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setHeroIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  const goToSlide = (index) => setHeroIndex(index);
  const next = () => setHeroIndex((i) => (i + 1) % HERO_SLIDES.length);
  const prev = () => setHeroIndex((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

  const features = [
    { iconKey: 'shipping', title: 'Free Shipping', text: 'On orders over $50' },
    { iconKey: 'payment', title: 'Secure Payment', text: '100% protected checkout' },
    { iconKey: 'quality', title: 'Quality Products', text: 'Curated for you' },
    { iconKey: 'returns', title: 'Easy Returns', text: 'Hassle-free within 30 days' }
  ];

  const renderFeatureIcon = (key) => {
    const common = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
    switch (key) {
      case 'shipping':
        return (
          <svg {...common}>
            <rect x="1" y="3" width="15" height="13" rx="1.5" />
            <path d="M16 8h4l2 3v5h-6V8z" />
            <circle cx="5.5" cy="18.5" r="2" />
            <circle cx="18.5" cy="18.5" r="2" />
          </svg>
        );
      case 'payment':
        return (
          <svg {...common}>
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
            <path d="M6 15h.01" />
            <path d="M10 15h4" />
          </svg>
        );
      case 'quality':
        return (
          <svg {...common}>
            <polygon points="12 2 15 9 22 9 17 14 18 22 12 18 6 22 7 14 2 9 9 9" />
          </svg>
        );
      case 'returns':
        return (
          <svg {...common}>
            <path d="M3 10h10a4 4 0 014 4v1" />
            <path d="M21 14h-10a4 4 0 01-4-4V9" />
            <path d="M7 6l-3 4 3 4" />
            <path d="M17 18l3-4-3-4" />
          </svg>
        );
      default:
        return null;
    }
  };

  const categories = [
    { slug: 'phones', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop', label: 'Phones', desc: 'Smartphones & accessories' },
    { slug: 'laptops', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop', label: 'Laptops', desc: 'Notebooks & workstations' },
    { slug: 'electronics', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop', label: 'Electronics', desc: 'Gadgets & devices' },
    { slug: 'accessories', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop', label: 'Accessories', desc: 'Cases, cables & more' },
    { slug: 'audio', image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop', label: 'Audio', desc: 'Headphones & speakers' },
    { slug: 'gaming', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=300&fit=crop', label: 'Gaming', desc: 'Gear for gamers' }
  ];

  return (
    <div className="home-page">
      <Navbar />

      {/* Hero Slideshow - Electronics / Sale */}
      <section className="home-hero home-hero-slider" aria-label="Featured promotions">
        <div className="home-hero-track">
          {HERO_SLIDES.map((slide, index) => (
            <div
              key={slide.id}
              className={`home-hero-slide home-hero-slide--${slide.theme} ${index === heroIndex ? 'active' : ''}`}
              aria-hidden={index !== heroIndex}
            >
              <div className="home-hero-slide-bg" aria-hidden="true" />
              <div className="home-hero-content">
                <p className="home-hero-badge">{slide.badge}</p>
                <h1 className="home-hero-title">{slide.title}</h1>
                <p className="home-hero-subtitle">{slide.subtitle}</p>
                <div className="home-hero-buttons">
                  <Link to={slide.to} className="btn-hero btn-hero-primary">{slide.cta}</Link>
                  <Link to="/products" className="btn-hero btn-hero-secondary">Shop all</Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="button" className="home-hero-arrow home-hero-arrow--prev" onClick={prev} aria-label="Previous slide">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <button type="button" className="home-hero-arrow home-hero-arrow--next" onClick={next} aria-label="Next slide">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
        </button>

        <div className="home-hero-dots" role="tablist" aria-label="Slide navigation">
          {HERO_SLIDES.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === heroIndex}
              aria-label={`Slide ${index + 1}`}
              className={`home-hero-dot ${index === heroIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </section>

      {/* Features Strip - animated */}
      <section className="home-features">
        <div className="home-features-inner">
          {features.map((item) => (
            <div key={item.title} className="home-feature">
              <span className={`home-feature-icon-wrap home-feature-icon-wrap--${item.iconKey}`} aria-hidden="true">
                {renderFeatureIcon(item.iconKey)}
              </span>
              <div className="home-feature-text">
                <h3 className="home-feature-title">{item.title}</h3>
                <p className="home-feature-desc">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shop by category */}
      <section className="home-categories">
        <div className="home-categories-inner">
          <h2 className="home-categories-title">Shop by category</h2>
          <p className="home-categories-desc">Find what you need across our product range</p>
          <div className="home-categories-grid">
            {categories.map((cat) => (
              <Link key={cat.slug} to={`/products?category=${cat.slug}`} className="home-category-card">
                <span className="home-category-image-wrap" aria-hidden="true">
                  <img src={cat.image} alt={cat.label} className="home-category-image" />
                </span>
                <span className="home-category-label">{cat.label}</span>
                <span className="home-category-card-desc">{cat.desc}</span>
                <span className="home-category-arrow">Shop →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="home-cta">
        <div className="home-cta-inner">
          <h2 className="home-cta-title">Ready to explore?</h2>
          <p className="home-cta-text">Browse our full collection of electronics, phones, laptops, and more.</p>
          <Link to="/products" className="btn-cta">View All Products</Link>
        </div>
      </section>

      {/* E-commerce Footer */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="home-footer-grid">
            <div className="home-footer-col">
              <h3 className="home-footer-heading">Shop</h3>
              <Link to="/products" className="home-footer-link">All Products</Link>
              <Link to="/products?category=phones" className="home-footer-link">Phones</Link>
              <Link to="/products?category=laptops" className="home-footer-link">Laptops</Link>
              <Link to="/products?category=electronics" className="home-footer-link">Electronics</Link>
            </div>
            <div className="home-footer-col">
              <h3 className="home-footer-heading">Support</h3>
              <span className="home-footer-link">Shipping Info</span>
              <span className="home-footer-link">Returns</span>
              <span className="home-footer-link">FAQ</span>
            </div>
            <div className="home-footer-col">
              <h3 className="home-footer-heading">Company</h3>
              <span className="home-footer-link">About Us</span>
              <span className="home-footer-link">Contact</span>
            </div>
          </div>
          <div className="home-footer-bottom">
            <p className="home-footer-text">© {new Date().getFullYear()} CityTech. Quality products, trusted service.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
