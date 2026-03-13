import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSocket, useSocketEvent } from '../context/SocketContext';
import { getImageUrl } from '../utils/imageUrl';
import './OrderDetail.css';

const formatPrice = (price) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(price);

const STATUS_LABELS = {
  pending: 'Order received',
  confirmed: 'Order confirmed',
  shipped: 'Order shipped',
  delivered: 'Order delivered',
  cancelled: 'Cancelled'
};

/** e.g. "1 Jan 2025, 10:30 AM" for timeline display */
const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const date = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${date}, ${time}`;
};

const PAYMENT_LABELS = {
  cod: 'Cash on Delivery',
  card: 'Debit / Credit'
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user, hasRole } = useAuth();
  const { addToCart } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [reorderLoading, setReorderLoading] = useState(false);
  const [orderRefreshTrigger, setOrderRefreshTrigger] = useState(0);

  const { socket } = useSocket();
  const onOrderUpdated = useCallback((payload) => {
    if (payload?.orderId === id) setOrderRefreshTrigger((t) => t + 1);
  }, [id]);
  useSocketEvent(socket, 'order:updated', onOrderUpdated);

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
  }, [id, isAuthenticated, user, hasRole, orderRefreshTrigger]);

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

  const showReorder = order && ['delivered', 'cancelled'].includes(order.status);
  const handleReorder = async () => {
    if (!order?.items?.length) return;
    setReorderLoading(true);
    setError('');
    let failed = false;
    for (const item of order.items) {
      const productId = item.product?._id;
      if (productId && (item.quantity || 0) > 0) {
        const result = await addToCart(productId, item.quantity || 1);
        if (!result.success) {
          setError(result.message || 'Failed to add items to cart');
          failed = true;
          break;
        }
      }
    }
    if (!failed) navigate(ROUTES.CART);
    setReorderLoading(false);
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
    navigate(ROUTES.LOGIN, { replace: true });
    return null;
  }

  if (user && hasRole(['admin'])) {
    navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
    return null;
  }
  if (user && hasRole(['vendor'])) {
    navigate(ROUTES.VENDOR_DASHBOARD, { replace: true });
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
            <Link to={ROUTES.ORDERS} className="order-detail-back">← Back to My Orders</Link>
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
          <Link to={ROUTES.ORDERS} className="order-detail-back">← Back to My Orders</Link>
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
                const isDelivered = order.status === 'delivered';
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
                    {isDelivered && productId && (
                      <Link
                        to={`/products/${productId}#reviews`}
                        className="order-detail-review-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Rate &amp; review this product
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
            {(order.subtotal != null || order.shippingCost != null || order.taxAmount != null) ? (
              <div className="order-detail-totals">
                <p className="order-detail-row"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></p>
                <p className="order-detail-row"><span>Shipping{order.subtotal >= 50 ? ' (Free on orders over $50)' : ''}</span><span>{formatPrice(order.shippingCost)}</span></p>
                <p className="order-detail-row"><span>Tax</span><span>{formatPrice(order.taxAmount)}</span></p>
                <p className="order-detail-total">Total: {formatPrice(order.totalAmount)}</p>
              </div>
            ) : (
              <p className="order-detail-total">Total: {formatPrice(order.totalAmount)}</p>
            )}
            {order.status === 'delivered' && (
              <p className="order-detail-review-note">
                Your order has been delivered. You can rate and review each product above.
              </p>
            )}
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

          {Array.isArray(order.statusHistory) && order.statusHistory.length > 0 && (
            <section className="order-detail-section">
              <h2 className="order-detail-section-title">Status history</h2>
              <p className="order-detail-status-history-intro">When each status changed:</p>
              <ul className="order-detail-status-history" aria-label="Order status timeline">
                {[...order.statusHistory]
                  .sort((a, b) => new Date(a.changedAt || 0) - new Date(b.changedAt || 0))
                  .map((entry, idx) => (
                    <li key={idx} className="order-detail-status-history-item">
                      <span className="order-detail-status-date">{formatDateTime(entry.changedAt)}</span>
                      <span className="order-detail-status-sep">—</span>
                      <span className={`order-detail-status-pill order-detail-status-${entry.status}`}>
                        {STATUS_LABELS[entry.status] || entry.status}
                      </span>
                      {entry.changedBy && (entry.changedBy.name || entry.changedBy.email) && (
                        <span className="order-detail-status-by"> (by {entry.changedBy.name || entry.changedBy.email})</span>
                      )}
                    </li>
                  ))}
              </ul>
            </section>
          )}

          {(cancellable || showReorder) && (
            <div className="order-detail-actions">
              {showReorder && (
                <button
                  type="button"
                  className="order-detail-reorder-btn"
                  onClick={handleReorder}
                  disabled={reorderLoading}
                >
                  {reorderLoading ? 'Adding to cart…' : 'Reorder'}
                </button>
              )}
              {cancellable && (
                <button
                  type="button"
                  className="order-detail-cancel-btn"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? 'Cancelling…' : 'Cancel order'}
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OrderDetail;
