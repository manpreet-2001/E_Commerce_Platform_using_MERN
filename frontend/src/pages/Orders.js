import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
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

const formatShippingAddress = (addr) => {
  if (!addr) return '—';
  const parts = [
    addr.fullName,
    addr.address,
    [addr.city, addr.state, addr.zip].filter(Boolean).join(', '),
    addr.country
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
};

const Orders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading: authLoading, hasRole } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOrderSuccess, setShowOrderSuccess] = useState(Boolean(location.state?.orderPlaced));

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
        if (!cancelled) setOrders(res.data.data || []);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load orders');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchOrders();
    return () => { cancelled = true; };
  }, [isAuthenticated, user]);

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
                    <span className="orders-card-id">Order #{order._id.slice(-6).toUpperCase()}</span>
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
                      </li>
                    ))}
                  </ul>
                  <p className="orders-card-total">Total: {formatPrice(order.totalAmount)}</p>
                  <div className="orders-card-meta">
                    <div className="orders-card-shipping">
                      <span className="orders-card-meta-label">Shipping address</span>
                      <p className="orders-card-meta-value">{formatShippingAddress(order.shippingAddress)}</p>
                    </div>
                    <div className="orders-card-payment">
                      <span className="orders-card-meta-label">Payment</span>
                      <p className="orders-card-meta-value">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || '—'}</p>
                    </div>
                  </div>
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
