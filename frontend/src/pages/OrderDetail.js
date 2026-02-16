import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUrl';
import './OrderDetail.css';

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

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user, hasRole } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!isAuthenticated() || (user && hasRole(['vendor', 'admin']))) return;
    let cancelled = false;
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`/api/orders/${id}`);
        if (!cancelled) setOrder(res.data.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Order not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchOrder();
    return () => { cancelled = true; };
  }, [id, isAuthenticated, user, hasRole]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    setError('');
    setCancelling(true);
    try {
      const res = await axios.patch(`/api/orders/${id}/cancel`);
      setOrder(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (authLoading) {
    return (
      <div className="order-detail-page">
        <Navbar />
        <div className="order-detail-loading"><div className="order-detail-spinner" /><p>Loading...</p></div>
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

  if (loading) {
    return (
      <div className="order-detail-page">
        <Navbar />
        <main className="order-detail-main">
          <div className="order-detail-loading"><div className="order-detail-spinner" /><p>Loading order…</p></div>
        </main>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="order-detail-page">
        <Navbar />
        <main className="order-detail-main">
          <div className="order-detail-container">
            <div className="order-detail-error">{error}</div>
            <Link to="/orders" className="order-detail-back">← Back to My Orders</Link>
          </div>
        </main>
      </div>
    );
  }

  const addr = order.shippingAddress || {};
  const cancellable = ['pending', 'confirmed'].includes(order.status);

  return (
    <div className="order-detail-page">
      <Navbar />
      <main className="order-detail-main">
        <div className="order-detail-container">
          <Link to="/orders" className="order-detail-back">← Back to My Orders</Link>
          {error && <div className="order-detail-error">{error}</div>}

          <div className="order-detail-header">
            <h1 className="order-detail-title">Order #{order._id.slice(-6).toUpperCase()}</h1>
            <span className={`order-detail-status order-detail-status-${order.status}`}>
              {STATUS_LABELS[order.status] || order.status}
            </span>
          </div>
          <p className="order-detail-date">
            {order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' }) : ''}
          </p>

          <section className="order-detail-section">
            <h2 className="order-detail-section-title">Products</h2>
            <ul className="order-detail-items">
              {order.items?.map((item, idx) => {
                const product = item.product;
                const productId = product?._id;
                return (
                  <li key={idx} className="order-detail-item">
                    <Link to={productId ? `/products/${productId}` : '#'} className="order-detail-item-link">
                      <div className="order-detail-item-image-wrap">
                        {product?.image ? (
                          <img
                            src={getImageUrl(product.image)}
                            alt={product?.name || 'Product'}
                            className="order-detail-item-image"
                          />
                        ) : (
                          <div className="order-detail-item-placeholder">No image</div>
                        )}
                      </div>
                      <div className="order-detail-item-info">
                        <span className="order-detail-item-name">{product?.name || 'Product'}</span>
                        <span className="order-detail-item-qty">× {item.quantity}</span>
                        <span className="order-detail-item-price">
                          {formatPrice((item.price || 0) * (item.quantity || 0))}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="order-detail-total">Total: {formatPrice(order.totalAmount)}</p>
          </section>

          <section className="order-detail-section">
            <h2 className="order-detail-section-title">Shipping address</h2>
            <address className="order-detail-address">
              {addr.fullName && <span className="order-detail-address-line">{addr.fullName}</span>}
              {addr.address && <span className="order-detail-address-line">{addr.address}</span>}
              {(addr.city || addr.state || addr.zip) && (
                <span className="order-detail-address-line">
                  {[addr.city, addr.state, addr.zip].filter(Boolean).join(', ')}
                </span>
              )}
              {addr.country && <span className="order-detail-address-line">{addr.country}</span>}
              {!addr.fullName && !addr.address && !addr.city && !addr.country && <span className="order-detail-address-line">—</span>}
            </address>
          </section>

          <section className="order-detail-section">
            <h2 className="order-detail-section-title">Payment</h2>
            <p className="order-detail-payment">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || '—'}</p>
          </section>

          {cancellable && (
            <div className="order-detail-actions">
              <button
                type="button"
                className="order-detail-cancel-btn"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling…' : 'Cancel order'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OrderDetail;
