import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import './Checkout.css';

const formatPrice = (price) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(price);

const Checkout = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { cartItems, cartLoading, cartTotal, clearCart, fetchCart } = useCart();
  const [message, setMessage] = useState('');
  const [placing, setPlacing] = useState(false);
  const [address, setAddress] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');

  useEffect(() => {
    if (!authLoading && !isAuthenticated()) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading) {
    return (
      <div className="checkout-page">
        <Navbar />
        <div className="checkout-loading-wrap"><div className="checkout-spinner" /><p>Loading...</p></div>
      </div>
    );
  }

  if (!isAuthenticated()) return null;

  if (!cartLoading && cartItems.length === 0) {
    navigate('/cart', { replace: true });
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setMessage('');
    setPlacing(true);
    try {
      await axios.post('/api/orders', {
        shippingAddress: address,
        paymentMethod: paymentMethod
      });
      await clearCart();
      navigate('/orders', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to place order';
      setMessage(msg);
      if (err.response?.status !== 401) fetchCart();
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="checkout-page">
      <Navbar />
      <main className="checkout-main">
        <div className="checkout-container">
          <h1 className="checkout-title">Checkout</h1>
          <Link to="/cart" className="checkout-back">← Back to cart</Link>

          {message && <div className="checkout-error">{message}</div>}

          <form className="checkout-form" onSubmit={handlePlaceOrder}>
            <section className="checkout-section">
              <h2 className="checkout-section-title">Delivery address</h2>
              <div className="checkout-fields">
                <label>
                  <span>Full name</span>
                  <input
                    type="text"
                    name="fullName"
                    value={address.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                  />
                </label>
                <label>
                  <span>Address</span>
                  <input
                    type="text"
                    name="address"
                    value={address.address}
                    onChange={handleChange}
                    placeholder="Street, building, apartment"
                    required
                  />
                </label>
                <div className="checkout-row">
                  <label>
                    <span>City</span>
                    <input
                      type="text"
                      name="city"
                      value={address.city}
                      onChange={handleChange}
                      placeholder="City"
                      required
                    />
                  </label>
                  <label>
                    <span>State / Province</span>
                    <input
                      type="text"
                      name="state"
                      value={address.state}
                      onChange={handleChange}
                      placeholder="State"
                    />
                  </label>
                  <label>
                    <span>ZIP / Postal code</span>
                    <input
                      type="text"
                      name="zip"
                      value={address.zip}
                      onChange={handleChange}
                      placeholder="ZIP"
                    />
                  </label>
                </div>
                <label>
                  <span>Country</span>
                  <input
                    type="text"
                    name="country"
                    value={address.country}
                    onChange={handleChange}
                    placeholder="Country"
                    required
                  />
                </label>
              </div>
            </section>

            <section className="checkout-section">
              <h2 className="checkout-section-title">Payment method</h2>
              <div className="checkout-payment-options">
                <label className="checkout-payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                  />
                  <span className="checkout-payment-label">Cash on Delivery</span>
                </label>
                <label className="checkout-payment-option checkout-payment-disabled">
                  <input type="radio" name="payment" value="card" disabled />
                  <span className="checkout-payment-label">Debit and Credit</span>
                  <span className="checkout-coming-soon">Coming soon</span>
                </label>
              </div>
            </section>

            <section className="checkout-section checkout-summary-section">
              <h2 className="checkout-section-title">Order summary</h2>
              <div className="checkout-summary-list">
                {cartItems.map((item) => {
                  const p = item.product;
                  if (!p) return null;
                  return (
                    <div key={p._id} className="checkout-summary-item">
                      <span className="checkout-summary-name">{p.name} × {item.quantity}</span>
                      <span className="checkout-summary-price">{formatPrice((p.price || 0) * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="checkout-total">
                <span>Total</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
            </section>

            <button
              type="submit"
              className="checkout-submit"
              disabled={placing}
            >
              {placing ? 'Placing order…' : 'Place order'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
