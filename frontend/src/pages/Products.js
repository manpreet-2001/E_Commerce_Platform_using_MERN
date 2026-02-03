import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './Products.css';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'phones', label: 'Phones' },
  { value: 'laptops', label: 'Laptops' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'audio', label: 'Audio' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'other', label: 'Other' }
];

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const params = category ? { category } : {};
        const res = await axios.get('/api/products', { params });
        setProducts(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
  };

  const formatCategory = (cat) => {
    return CATEGORIES.find(c => c.value === cat)?.label || cat;
  };

  return (
    <div className="products-page">
      <Navbar />

      <header className="products-header">
        <div className="products-header-inner">
          <h1>Our Products</h1>
          <p>Discover quality electronics and accessories</p>
        </div>
      </header>

      <main className="products-main">
        <div className="products-container">
          {/* Category filter */}
          <div className="products-filters">
            <span className="filter-label">Category:</span>
            <div className="filter-pills">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value || 'all'}
                  type="button"
                  className={`filter-pill ${!category && !cat.value ? 'active' : category === cat.value ? 'active' : ''}`}
                  onClick={() => setCategory(cat.value)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="products-error">
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="products-loading">
              <div className="products-spinner" />
              <p>Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="products-empty">
              <div className="empty-icon">📦</div>
              <h2>No products yet</h2>
              <p>{category ? `No products in "${formatCategory(category)}".` : 'Be the first to add products.'}</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <article key={product._id} className="product-card">
                  <Link to={`/products/${product._id}`} className="product-card-link">
                    <div className="product-card-image-wrap">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="product-card-image"
                        />
                      ) : (
                        <div className="product-card-placeholder">
                          <span className="placeholder-icon">📷</span>
                          <span>No image</span>
                        </div>
                      )}
                      {product.stock !== undefined && product.stock < 10 && product.stock > 0 && (
                        <span className="product-badge low-stock">Low stock</span>
                      )}
                      {product.stock === 0 && (
                        <span className="product-badge out-of-stock">Out of stock</span>
                      )}
                    </div>
                    <div className="product-card-body">
                      <span className="product-card-category">{formatCategory(product.category)}</span>
                      <h2 className="product-card-title">{product.name}</h2>
                      {product.description && (
                        <p className="product-card-desc">{product.description.slice(0, 80)}{product.description.length > 80 ? '…' : ''}</p>
                      )}
                      <div className="product-card-footer">
                        <span className="product-card-price">{formatPrice(product.price)}</span>
                        <span className="product-card-cta">View details →</span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Products;
