import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import VendorProductForm from '../components/VendorProductForm';
import { getImageUrl } from '../utils/imageUrl';
import './VendorDashboard.css';

const SIDEBAR_SECTIONS = [
  { id: 'products', label: 'My Products', icon: '📦' },
  { id: 'orders', label: 'My Orders', icon: '🛒' },
];

const CATEGORY_LABELS = {
  electronics: 'Electronics',
  phones: 'Phones',
  laptops: 'Laptops',
  accessories: 'Accessories',
  audio: 'Audio',
  gaming: 'Gaming',
  other: 'Other',
};

const VendorDashboard = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('products');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const displayName = user?.name || user?.email?.split('@')[0] || 'Vendor';

  const fetchMyProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError('');
    try {
      const res = await axios.get('/api/products/vendor/mine');
      setProducts(res.data.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load your products';
      setProductsError(msg);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === 'products') {
      fetchMyProducts();
    }
  }, [activeSection, fetchMyProducts]);

  const openAddForm = () => {
    setEditingProduct(null);
    setFormError('');
    setFormOpen(true);
  };

  const openEditForm = (product) => {
    setEditingProduct(product);
    setFormError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingProduct(null);
    setFormError('');
  };

  const handleFormSubmit = async (payload) => {
    if (payload.imageError) {
      setFormError(payload.imageError);
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      if (editingProduct?._id) {
        await axios.put(`/api/products/${editingProduct._id}`, payload);
      } else {
        await axios.post('/api/products', payload);
      }
      await fetchMyProducts();
      closeForm();
    } catch (err) {
      const msg = err.response?.data?.message || (editingProduct?._id ? 'Update failed' : 'Add failed');
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (product) => {
    if (!product?._id) return;
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/products/${product._id}`);
      await fetchMyProducts();
    } catch (err) {
      const msg = err.response?.data?.message || 'Delete failed';
      alert(msg);
    }
  };

  return (
    <div className="vendor-dashboard-page">
      <Navbar />

      <div className="vendor-dashboard-layout">
        <aside className={`vendor-dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="vendor-sidebar-inner">
            <div className="vendor-sidebar-header">
              <h2 className="vendor-sidebar-title">Dashboard</h2>
              <button
                type="button"
                className="vendor-sidebar-close"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            <div className="vendor-sidebar-user">
              <span className="vendor-sidebar-avatar" aria-hidden>
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span className="vendor-sidebar-name">{displayName}</span>
            </div>

            <nav className="vendor-sidebar-nav">
              {SIDEBAR_SECTIONS.map(({ id, label, icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`vendor-sidebar-item ${activeSection === id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSection(id);
                    setSidebarOpen(false);
                  }}
                >
                  <span className="vendor-sidebar-item-icon">{icon}</span>
                  <span className="vendor-sidebar-item-label">{label}</span>
                </button>
              ))}
            </nav>

            <div className="vendor-sidebar-footer">
              <Link
                to="/products"
                className="vendor-sidebar-back"
                onClick={() => setSidebarOpen(false)}
              >
                ← Back to Shop
              </Link>
            </div>
          </div>
        </aside>

        <button
          type="button"
          className={`vendor-dashboard-overlay ${sidebarOpen ? 'visible' : ''}`}
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        />

        <main className="vendor-dashboard-main">
          <div className="vendor-main-inner">
            <button
              type="button"
              className="vendor-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>

            <header className="vendor-main-header">
              <div>
                <h1 className="vendor-main-title">
                  {activeSection === 'products' ? 'My Products' : 'My Orders'}
                </h1>
                <p className="vendor-main-greeting">Hello, {displayName}</p>
              </div>
            </header>

            <div className="vendor-stats">
              <div className="vendor-stat-card">
                <span className="vendor-stat-value">{products.length}</span>
                <span className="vendor-stat-label">Products</span>
              </div>
              <div className="vendor-stat-card">
                <span className="vendor-stat-value">0</span>
                <span className="vendor-stat-label">Orders</span>
              </div>
            </div>

            <div className="vendor-dashboard-content">
              {activeSection === 'products' && (
                <div className="vendor-tab-panel vendor-products-panel">
                  <div className="vendor-products-header">
                    <h2 className="vendor-products-heading">Your products</h2>
                    <button type="button" className="vendor-products-add-btn" onClick={openAddForm}>
                      + Add Product
                    </button>
                  </div>

                  {productsError && (
                    <div className="vendor-products-error">{productsError}</div>
                  )}

                  {productsLoading ? (
                    <div className="vendor-products-loading">Loading products…</div>
                  ) : products.length === 0 ? (
                    <div className="vendor-placeholder">
                      <p className="vendor-placeholder-title">No products yet</p>
                      <p className="vendor-placeholder-text">
                        Add your first product to start selling.
                      </p>
                      <button type="button" className="vendor-placeholder-btn" onClick={openAddForm}>
                        Add Product
                      </button>
                    </div>
                  ) : (
                    <div className="vendor-products-list">
                      {products.map((p) => (
                        <div key={p._id} className="vendor-product-card">
                          <div className="vendor-product-card-image">
                            {p.image ? (
                              <img src={getImageUrl(p.image)} alt="" />
                            ) : (
                              <span className="vendor-product-card-no-image">No image</span>
                            )}
                          </div>
                          <div className="vendor-product-card-body">
                            <h3 className="vendor-product-card-name">{p.name}</h3>
                            <p className="vendor-product-card-meta">
                              ${Number(p.price).toFixed(2)} · {CATEGORY_LABELS[p.category] || p.category} · Stock: {p.stock}
                            </p>
                            {p.description && (
                              <p className="vendor-product-card-desc">
                                {p.description.length > 80 ? p.description.slice(0, 80) + '…' : p.description}
                              </p>
                            )}
                            <div className="vendor-product-card-actions">
                              <button
                                type="button"
                                className="vendor-product-card-btn vendor-product-card-btn-edit"
                                onClick={() => openEditForm(p)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="vendor-product-card-btn vendor-product-card-btn-delete"
                                onClick={() => handleDelete(p)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'orders' && (
                <div className="vendor-tab-panel">
                  <div className="vendor-placeholder">
                    <p className="vendor-placeholder-title">My Orders</p>
                    <p className="vendor-placeholder-text">
                      View and update orders that include your products.
                    </p>
                    <p className="vendor-placeholder-note">(Order management coming soon)</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {formOpen && (
        <div className="vendor-modal-backdrop" onClick={closeForm}>
          <div className="vendor-modal" onClick={(e) => e.stopPropagation()}>
            <VendorProductForm
              product={editingProduct}
              onSubmit={handleFormSubmit}
              onCancel={closeForm}
              loading={formLoading}
              error={formError}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
