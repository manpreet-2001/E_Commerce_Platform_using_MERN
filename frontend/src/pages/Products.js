import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
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

const DEBOUNCE_MS = 400;

const Products = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Sync category from URL (e.g. /products?category=phones)
  useEffect(() => {
    const q = searchParams.get('category') || '';
    setCategory(q);
  }, [searchParams]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (category) params.category = category;
        if (search) params.search = search;
        const res = await axios.get('/api/products', { params });
        const list = res.data?.data ?? res.data;
        setProducts(Array.isArray(list) ? list : []);
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Failed to load products';
        const isNetworkError = !err.response && (err.message === 'Network Error' || err.code === 'ECONNREFUSED');
        setError(isNetworkError
          ? 'Cannot reach server. Start the backend (npm run dev in backend/) and ensure MongoDB is connected.'
          : msg
        );
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, search]);

  const getCategoryLabel = (cat) => CATEGORIES.find(c => c.value === cat)?.label || cat;

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
          {/* Search and filters */}
          <div className="products-filters">
            <div className="products-search-wrap">
              <label htmlFor="product-search" className="filter-label">Search</label>
              <input
                id="product-search"
                type="search"
                placeholder="Search by name or description..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="products-search-input"
                aria-label="Search products"
              />
            </div>
            <div className="products-filters-row">
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
              <h2>No products found</h2>
              <p>
                {search
                  ? `No products match "${search}"${category ? ` in ${getCategoryLabel(category)}` : ''}. Try a different search or category.`
                  : category
                    ? `No products in "${getCategoryLabel(category)}".`
                    : 'Be the first to add products.'}
              </p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  getCategoryLabel={getCategoryLabel}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Products;
