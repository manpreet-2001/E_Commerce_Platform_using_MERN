import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useOrderNotification } from '../context/OrderNotificationContext';
import { getImageUrl } from '../utils/imageUrl';
import './Orders.css';

const formatPrice = (price) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(price);

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

const PAYMENT_LABELS = {
  cod: 'Cash on Delivery',
  card: 'Debit / Credit'
};

const formatShippingAddressLines = (addr) => {
  if (!addr) return [];
  const lines = [];
  if (addr.fullName) lines.push(addr.fullName);
  if (addr.address) lines.push(addr.address);
  const cityStateZip = [addr.city, addr.state, addr.zip].filter(Boolean).join(', ');
  if (cityStateZip) lines.push(cityStateZip);
  if (addr.country) lines.push(addr.country);
  return lines.length ? lines : ['—'];
};

const Orders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading: authLoading, hasRole } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOrderSuccess, setShowOrderSuccess] = useState(Boolean(location.state?.orderPlaced));
  const [cancellingId, setCancellingId] = useState(null);

  // Clear location state so back button doesn't re-show the message
  useEffect(() => {
    if (location.state?.orderPlaced) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (!showOrderSuccess) return;
    const timer = setTimeout(() => setShowOrderSuccess(false), 5000);
    return () => clearTimeout(timer);
  }, [showOrderSuccess]);

  useEffect(() => {
    if (!isAuthenticated() || (user && hasRole(['vendor', 'admin']))) return;
    let cancelled = false;
    const fetchOrders = async () => {
      try {
        const res = await axios.get('/api/orders');
        const list = res.data.data || [];
        if (!cancelled) {
          setOrders(list);
          setOrdersViewed(list);
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load orders');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchOrders();
    return () => { cancelled = true; };
  }, [isAuthenticated, user]);

  const cancellableStatuses = ['pending', 'confirmed'];
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    setError('');
    setCancellingId(orderId);
    try {
      await axios.patch(`/api/orders/${orderId}/cancel`);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: 'cancelled' } : o))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="orders-page">
        <Navbar />
        <div className="orders-loading"><div className="orders-spinner" /><p>Loading...</p></div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    navigate('/login', { replace: true });
    return null;
  }

  if (user && hasRole(['vendor', 'admin'])) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  return (
    <div className="orders-page">
      <Navbar />
      <main className="orders-main">
        <div className="orders-container">
          <h1 className="orders-title">My Orders</h1>
          {showOrderSuccess && (
            <div className="orders-success" role="alert">
              Order placed successfully! Thank you for your purchase.
            </div>
          )}
          {error && <div className="orders-error">{error}</div>}
          {loading ? (
            <div className="orders-loading"><div className="orders-spinner" /><p>Loading orders…</p></div>
          ) : orders.length === 0 ? (
            <div className="orders-empty">
              <p>You have no orders yet.</p>
              <Link to="/products" className="orders-cta">Browse products</Link>
            </div>
          ) : (
            <ul className="orders-list">
              {orders.map((order) => (
                <li key={order._id} className="orders-card">
                  <div className="orders-card-header">
                    <Link to={`/orders/${order._id}`} className="orders-card-id">
                      Order #{order._id.slice(-6).toUpperCase()}
                    </Link>
                    <span className={`orders-card-status orders-status-${order.status}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                  <p className="orders-card-date">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                  </p>
                  <ul className="orders-card-items">
                    {order.items?.map((item, idx) => (
                      <li key={idx} className="orders-card-item">
                        <Link
                          to={`/orders/${order._id}`}
                          className="orders-card-item-inner"
                        >
                          <div className="orders-card-item-image-wrap">
                            {item.product?.image ? (
                              <img
                                src={getImageUrl(item.product.image)}
                                alt={item.product.name || 'Product'}
                                className="orders-card-item-image"
                              />
                            ) : (
                              <div className="orders-card-item-placeholder">No image</div>
                            )}
                          </div>
                          <div className="orders-card-item-info">
                            {item.product?.name} × {item.quantity} — {formatPrice((item.price || 0) * (item.quantity || 0))}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <p className="orders-card-total">Total: {formatPrice(order.totalAmount)}</p>
                  <div className="orders-card-meta">
                    <div className="orders-card-shipping">
                      <span className="orders-card-meta-label">Shipping address</span>
                      <div className="orders-card-address">
                        {formatShippingAddressLines(order.shippingAddress).map((line, i) => (
                          <span key={i} className="orders-card-address-line">{line}</span>
                        ))}
                      </div>
                    </div>
                    <div className="orders-card-payment">
                      <span className="orders-card-meta-label">Payment</span>
                      <p className="orders-card-meta-value">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || '—'}</p>
                    </div>
                  </div>
                  {cancellableStatuses.includes(order.status) && (
                    <div className="orders-card-actions">
                      <button
                        type="button"
                        className="orders-cancel-btn"
                        onClick={() => handleCancelOrder(order._id)}
                        disabled={cancellingId === order._id}
                      >
                        {cancellingId === order._id ? 'Cancelling…' : 'Cancel order'}
                      </button>
                    </div>
                  )}
                  {order.status === 'delivered' && (
                    <Link to={`/orders/${order._id}`} className="orders-review-cta">
                      Rate &amp; review products →
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default Orders;
