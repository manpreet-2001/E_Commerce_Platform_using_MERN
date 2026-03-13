import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import { useSocket, useSocketEvent } from '../context/SocketContext';
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

const LIMIT = 12;

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showLoadingUI, setShowLoadingUI] = useState(false);
  const fetchRef = useRef(null);

  const LOADING_DELAY_MS = 280;

  const { socket } = useSocket();
  useSocketEvent(socket, 'products:updated', () => {
    if (fetchRef.current) fetchRef.current();
  });

  // Sync from URL (category, sort, search, page)
  useEffect(() => {
    const cat = searchParams.get('category') || '';
    const srt = searchParams.get('sort') || '';
    const q = searchParams.get('search') || '';
    const p = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);
    setCategory(cat);
    setSort(srt);
    setSearch(q);
    setSearchInput(q);
    setPage(p);
  }, [searchParams]);

  // Debounce search input -> update URL and search state
  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = searchInput.trim();
      setSearch(trimmed);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (trimmed) next.set('search', trimmed);
        else next.delete('search');
        next.delete('page');
        return next;
      }, { replace: true });
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps -- only run on searchInput change

  useEffect(() => {
    setPage(1);
  }, [category, sort]);

  // Delay showing loading spinner so fast responses don't flash it
  useEffect(() => {
    if (!loading) {
      setShowLoadingUI(false);
      return;
    }
    if (products.length > 0) return;
    const t = setTimeout(() => setShowLoadingUI(true), LOADING_DELAY_MS);
    return () => clearTimeout(t);
  }, [loading, products.length]);

  useEffect(() => {
    let cancelled = false;
    setError('');
    setLoading(true);
    const doFetch = async () => {
      try {
        const params = { page, limit: LIMIT };
        if (category) params.category = category;
        if (search) params.search = search;
        if (sort) params.sort = sort;
        const res = await axios.get('/api/products', { params });
        if (cancelled) return;
        const list = res.data?.data ?? res.data;
        setProducts(Array.isArray(list) ? list : []);
        setTotal(res.data?.total ?? 0);
        setTotalPages(res.data?.totalPages ?? 0);
      } catch (err) {
        if (cancelled) return;
        const msg = err.response?.data?.message || err.message || 'Failed to load products';
        const isNetworkError = !err.response && (err.message === 'Network Error' || err.code === 'ECONNREFUSED');
        setError(isNetworkError
          ? 'Cannot reach server. Start the backend (npm run dev in backend/) and ensure MongoDB is connected.'
          : msg
        );
        setProducts([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchRef.current = doFetch;
    doFetch();
    return () => { cancelled = true; };
  }, [category, search, sort, page]);

  const getCategoryLabel = (cat) => CATEGORIES.find(c => c.value === cat)?.label || cat;

  const handleCategoryChange = (categoryValue) => {
    const next = {};
    if (categoryValue) next.category = categoryValue;
    if (sort) next.sort = sort;
    if (search) next.search = search;
    setSearchParams(Object.keys(next).length ? next : {});
  };

  const handleSortChange = (sortValue) => {
    const next = {};
    if (category) next.category = category;
    if (sortValue) next.sort = sortValue;
    if (search) next.search = search;
    setSearchParams(Object.keys(next).length ? next : {});
  };

  const goToPage = (p) => {
    const next = new URLSearchParams(searchParams);
    if (p <= 1) next.delete('page');
    else next.set('page', String(p));
    setSearchParams(next, { replace: true });
    setPage(p);
  };

  // Build page numbers to show (e.g. 1 2 3 ... 8 or 1 ... 4 5 6 ... 10)
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (page <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('ellipsis', totalPages);
    } else if (page >= totalPages - 3) {
      pages.push(1, 'ellipsis');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages);
    }
    return pages;
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
                    onClick={() => handleCategoryChange(cat.value)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="products-sort-row">
              <label htmlFor="product-sort" className="filter-label">Sort by:</label>
              <select
                id="product-sort"
                className="products-sort-select"
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                aria-label="Sort products"
              >
                <option value="">Newest first</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="products-error">
              <p>{error}</p>
            </div>
          )}

          {loading && products.length === 0 ? (
            <div className="products-loading">
              {showLoadingUI ? (
                <>
                  <div className="products-spinner" />
                  <p>Loading products...</p>
                </>
              ) : (
                <p className="products-loading-brief">Loading...</p>
              )}
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
            <>
              <div className="products-grid-wrapper" style={{ position: 'relative' }}>
                {loading && products.length > 0 && (
                  <div
                    className="products-loading-overlay"
                    style={{
                      position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, borderRadius: 8,
                    }}
                    aria-hidden
                  >
                    <div className="products-spinner" />
                  </div>
                )}
                <div className="products-grid">
                  {products.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      getCategoryLabel={getCategoryLabel}
                    />
                  ))}
                </div>
              </div>
              {totalPages > 1 && (
                <nav className="products-pagination" aria-label="Product list pagination">
                  <button
                    type="button"
                    className="products-pagination-btn"
                    onClick={() => goToPage(Math.max(1, page - 1))}
                    disabled={page <= 1 || loading}
                  >
                    Previous
                  </button>
                  <div className="products-pagination-numbers">
                    {getPageNumbers().map((n, i) =>
                      n === 'ellipsis' ? (
                        <span key={`ellipsis-${i}`} className="products-pagination-ellipsis" aria-hidden>…</span>
                      ) : (
                        <button
                          key={n}
                          type="button"
                          className={`products-pagination-num ${page === n ? 'active' : ''}`}
                          onClick={() => goToPage(n)}
                          disabled={loading}
                          aria-label={`Page ${n}`}
                          aria-current={page === n ? 'page' : undefined}
                        >
                          {n}
                        </button>
                      )
                    )}
                  </div>
                  <button
                    type="button"
                    className="products-pagination-btn"
                    onClick={() => goToPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages || loading}
                  >
                    Next
                  </button>
                  <span className="products-pagination-info">
                    Page {page} of {totalPages} ({total} total)
                  </span>
                </nav>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Products;
