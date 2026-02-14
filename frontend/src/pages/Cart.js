import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import CartItem from '../components/CartItem';
import './Cart.css';

const formatPrice = (price) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(price);

const Cart = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { cartItems, cartLoading, cartError, cartTotal, updateQuantity, removeFromCart, clearCart, fetchCart } = useCart();
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  if (authLoading) {
    return (
      <div className="cart-page">
        <Navbar />
        <div className="cart-loading-wrap"><div className="cart-spinner" /><p>Loading...</p></div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleQuantityChange = async (productId, newQty) => {
    if (newQty < 1) return;
    setUpdatingId(productId);
    setMessage('');
    const result = await updateQuantity(productId, newQty);
    setUpdatingId(null);
    if (result.success) setMessage('Quantity updated');
    else setMessage(result.message || 'Update failed');
  };

  const handleRemove = async (productId) => {
    setUpdatingId(productId);
    setMessage('');
    await removeFromCart(productId);
    setUpdatingId(null);
  };

  const handleClearCart = async () => {
    if (!window.confirm('Remove all items from your cart?')) return;
    setMessage('');
    await clearCart();
  };

  const handleCheckout = async () => {
    setMessage('');
    setCheckoutLoading(true);
    try {
      await axios.post('/api/orders', { shippingAddress: {} });
      await clearCart();
      navigate('/orders', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Checkout failed';
      setMessage(msg);
      if (err.response?.status !== 401) fetchCart();
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="cart-page">
      <Navbar />

      <main className="cart-main">
        <div className="cart-container">
          <h1 className="cart-title">Your Cart</h1>

          {cartError && <div className="cart-error">{cartError}</div>}
          {message && <div className="cart-message">{message}</div>}

          {cartLoading ? (
            <div className="cart-loading-wrap">
              <div className="cart-spinner" />
              <p>Loading cart...</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">🛒</div>
              <h2>Your cart is empty</h2>
              <p>Add items from the shop to get started.</p>
              <Link to="/products" className="cart-cta">Continue shopping</Link>
            </div>
          ) : (
            <>
              <div className="cart-list">
                {cartItems.map((item) => {
                  const productId = item.product?._id;
                  if (!productId) return null;
                  return (
                    <CartItem
                      key={productId}
                      item={item}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemove}
                      isUpdating={updatingId === productId}
                    />
                  );
                })}
              </div>

              <div className="cart-footer">
                <button type="button" className="cart-clear-btn" onClick={handleClearCart}>
                  Clear cart
                </button>
                <div className="cart-summary">
                  <span className="cart-summary-label">Subtotal</span>
                  <span className="cart-summary-total">{formatPrice(cartTotal)}</span>
                </div>
                <Link to="/products" className="cart-cta cart-cta-secondary">Continue shopping</Link>
                <button
                  type="button"
                  className="cart-cta cart-cta-primary"
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? 'Placing order…' : 'Place order'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Cart;
