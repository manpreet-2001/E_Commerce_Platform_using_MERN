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

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

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

  const fetchVendorOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError('');
    try {
      const res = await axios.get('/api/orders/vendor/mine');
      setOrders(res.data.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load orders';
      setOrdersError(msg);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === 'products') {
      fetchMyProducts();
    } else if (activeSection === 'orders') {
      fetchVendorOrders();
    }
  }, [activeSection, fetchMyProducts, fetchVendorOrders]);

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

  const handleOrderStatusChange = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await axios.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      await fetchVendorOrders();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update status';
      alert(msg);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(price);
  const ORDER_STATUSES = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

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
                <span className="vendor-stat-value">{orders.length}</span>
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
                <div className="vendor-tab-panel vendor-orders-panel">
                  <h2 className="vendor-orders-heading">Orders containing your products</h2>
                  {ordersError && <div className="vendor-products-error">{ordersError}</div>}
                  {ordersLoading ? (
                    <div className="vendor-products-loading">Loading orders…</div>
                  ) : orders.length === 0 ? (
                    <div className="vendor-placeholder">
                      <p className="vendor-placeholder-title">No orders yet</p>
                      <p className="vendor-placeholder-text">
                        When customers buy your products, orders will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="vendor-orders-list">
                      {orders.map((order) => (
                        <div key={order._id} className="vendor-order-card">
                          <div className="vendor-order-card-header">
                            <div>
                              <span className="vendor-order-id">Order #{order._id.slice(-6).toUpperCase()}</span>
                              <span className="vendor-order-customer">
                                {order.user?.name || order.user?.email || 'Customer'}
                              </span>
                            </div>
                            <span className={`vendor-order-status vendor-order-status-${order.status}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="vendor-order-date">
                            {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                          </p>
                          <ul className="vendor-order-items">
                            {order.items?.map((item, idx) => (
                              <li key={idx} className="vendor-order-item">
                                {item.product?.name} × {item.quantity} @ {formatPrice(item.price)} = {formatPrice((item.price || 0) * (item.quantity || 0))}
                              </li>
                            ))}
                          </ul>
                          <div className="vendor-order-footer">
                            <span className="vendor-order-subtotal">Your total: {formatPrice(order.vendorSubtotal || 0)}</span>
                            <div className="vendor-order-actions">
                              <label htmlFor={`status-${order._id}`} className="vendor-order-status-label">Status:</label>
                              <select
                                id={`status-${order._id}`}
                                className="vendor-order-status-select"
                                value={order.status}
                                onChange={(e) => handleOrderStatusChange(order._id, e.target.value)}
                                disabled={updatingOrderId === order._id}
                              >
                                {ORDER_STATUSES.map((s) => (
                                  <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                              </select>
                              {updatingOrderId === order._id && <span className="vendor-order-updating">Updating…</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
