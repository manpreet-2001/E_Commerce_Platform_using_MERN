import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import './Checkout.css';

const formatPrice = (price) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(price);

const emptyAddress = () => ({
  fullName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: ''
});

const formatAddressLine = (addr) => {
  const parts = [
    addr.fullName,
    addr.address,
    [addr.city, addr.state, addr.zip].filter(Boolean).join(', '),
    addr.country
  ].filter(Boolean);
  return parts.join(', ') || '—';
};

const Checkout = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { cartItems, cartLoading, cartSubtotal, cartShippingCost, cartTaxAmount, cartTotal, freeShippingThreshold, clearCart, fetchCart } = useCart();
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [savedAddressesLoading, setSavedAddressesLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState(null); // null | number (index) | 'new'
  const [address, setAddress] = useState(emptyAddress());
  const [saveAddressForNext, setSaveAddressForNext] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');

  useEffect(() => {
    if (!authLoading && !isAuthenticated()) {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated()) return;
    let cancelled = false;
    axios.get('/api/auth/saved-addresses')
      .then((res) => {
        if (!cancelled && res.data?.data?.length) {
          setSavedAddresses(res.data.data);
          setSelectedAddress(0);
          setAddress({
            fullName: res.data.data[0].fullName || '',
            address: res.data.data[0].address || '',
            city: res.data.data[0].city || '',
            state: res.data.data[0].state || '',
            zip: res.data.data[0].zip || '',
            country: res.data.data[0].country || ''
          });
        } else if (!cancelled) {
          setSelectedAddress('new');
        }
      })
      .catch(() => {
        if (!cancelled) setSelectedAddress(selectedAddress === null ? 'new' : selectedAddress);
      })
      .finally(() => {
        if (!cancelled) setSavedAddressesLoading(false);
      });
    return () => { cancelled = true; };
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps -- run once when authenticated

  useEffect(() => {
    if (typeof selectedAddress === 'number' && savedAddresses[selectedAddress]) {
      const a = savedAddresses[selectedAddress];
      setAddress({
        fullName: a.fullName || '',
        address: a.address || '',
        city: a.city || '',
        state: a.state || '',
        zip: a.zip || '',
        country: a.country || ''
      });
    } else if (selectedAddress === 'new') {
      setAddress(emptyAddress());
    }
  }, [selectedAddress, savedAddresses]);

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
    navigate(ROUTES.CART, { replace: true });
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setMessage('');
  };

  const getShippingAddressForOrder = () => {
    if (typeof selectedAddress === 'number' && savedAddresses[selectedAddress]) {
      const a = savedAddresses[selectedAddress];
      return {
        fullName: a.fullName || '',
        address: a.address || '',
        city: a.city || '',
        state: a.state || '',
        zip: a.zip || '',
        country: a.country || ''
      };
    }
    return address;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setMessage('');
    const shippingAddress = getShippingAddressForOrder();
    const err = {};
    if (!shippingAddress.fullName?.trim()) err.fullName = 'Full name is required';
    if (!shippingAddress.address?.trim()) err.address = 'Address is required';
    if (!shippingAddress.city?.trim()) err.city = 'City is required';
    if (!shippingAddress.country?.trim()) err.country = 'Country is required';
    if (Object.keys(err).length > 0) {
      setFieldErrors(err);
      return;
    }
    setFieldErrors({});
    setPlacing(true);
    try {
      await axios.post('/api/orders', {
        shippingAddress,
        paymentMethod
      });
      if (saveAddressForNext && selectedAddress === 'new' && address.fullName?.trim() && address.address?.trim() && address.city?.trim() && address.country?.trim()) {
        try {
          await axios.post('/api/auth/saved-addresses', address);
        } catch {
          // non-blocking
        }
      }
      await clearCart();
      navigate(ROUTES.ORDERS, { replace: true, state: { orderPlaced: true } });
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
          <Link to={ROUTES.CART} className="checkout-back">← Back to cart</Link>

          {message && <div className="form-error" role="alert">{message}</div>}

          <form className="checkout-form" onSubmit={handlePlaceOrder}>
            <section className="checkout-section">
              <h2 className="checkout-section-title">Delivery address</h2>

              {savedAddressesLoading ? (
                <p className="checkout-address-loading">Loading addresses…</p>
              ) : savedAddresses.length > 0 ? (
                <>
                  <p className="checkout-address-label">Select address</p>
                  <div className="checkout-address-list">
                    {savedAddresses.map((addr, index) => (
                      <label key={index} className="checkout-address-option">
                        <input
                          type="radio"
                          name="deliveryAddress"
                          checked={selectedAddress === index}
                          onChange={() => setSelectedAddress(index)}
                        />
                        <span className="checkout-address-option-text">{formatAddressLine(addr)}</span>
                      </label>
                    ))}
                    <label className="checkout-address-option">
                      <input
                        type="radio"
                        name="deliveryAddress"
                        checked={selectedAddress === 'new'}
                        onChange={() => setSelectedAddress('new')}
                      />
                      <span className="checkout-address-option-text">Add new address</span>
                    </label>
                  </div>
                </>
              ) : null}

              {(selectedAddress === 'new' || (savedAddresses.length === 0 && !savedAddressesLoading)) && (
                <div className="checkout-fields">
                  <label htmlFor="checkout-fullName">
                    <span>Full name</span>
                    <input
                      id="checkout-fullName"
                      type="text"
                      name="fullName"
                      value={address.fullName}
                      onChange={handleChange}
                      placeholder="First and last name"
                      className={fieldErrors.fullName ? 'input-error' : ''}
                    />
                    {fieldErrors.fullName && <p className="form-field-error">{fieldErrors.fullName}</p>}
                  </label>
                  <label>
                    <span>Address</span>
                    <input
                      type="text"
                      name="address"
                      value={address.address}
                      onChange={handleChange}
                      placeholder="Street, building, apartment"
                      className={fieldErrors.address ? 'input-error' : ''}
                    />
                    {fieldErrors.address && <p className="form-field-error">{fieldErrors.address}</p>}
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
                        className={fieldErrors.city ? 'input-error' : ''}
                      />
                      {fieldErrors.city && <p className="form-field-error">{fieldErrors.city}</p>}
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
                      className={fieldErrors.country ? 'input-error' : ''}
                    />
                    {fieldErrors.country && <p className="form-field-error">{fieldErrors.country}</p>}
                  </label>
                  <label className="checkout-save-address-label">
                    <input
                      type="checkbox"
                      checked={saveAddressForNext}
                      onChange={(e) => setSaveAddressForNext(e.target.checked)}
                    />
                    <span>Save this address for next time</span>
                  </label>
                </div>
              )}

              {typeof selectedAddress === 'number' && savedAddresses[selectedAddress] && (
                <p className="checkout-selected-address">{formatAddressLine(savedAddresses[selectedAddress])}</p>
              )}
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
              <div className="checkout-summary-breakdown">
                <div className="checkout-summary-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartSubtotal)}</span>
                </div>
                <div className="checkout-summary-row">
                  <span>
                    Shipping
                    {cartSubtotal >= freeShippingThreshold ? (
                      <span className="checkout-summary-note"> (Free on orders over ${freeShippingThreshold})</span>
                    ) : (
                      <span className="checkout-summary-note"> (Add ${(freeShippingThreshold - cartSubtotal).toFixed(2)} more to your order to get free shipping)</span>
                    )}
                  </span>
                  <span>{formatPrice(cartShippingCost)}</span>
                </div>
                <div className="checkout-summary-row">
                  <span>Tax (13%)</span>
                  <span>{formatPrice(cartTaxAmount)}</span>
                </div>
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
