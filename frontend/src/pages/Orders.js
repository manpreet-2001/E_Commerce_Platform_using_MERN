import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
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

const Orders = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, hasRole } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
                        {item.product?.name} × {item.quantity} — {formatPrice((item.price || 0) * (item.quantity || 0))}
                      </li>
                    ))}
                  </ul>
                  <p className="orders-card-total">Total: {formatPrice(order.totalAmount)}</p>
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
