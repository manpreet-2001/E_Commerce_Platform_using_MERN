import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import './Cart.css';

const formatPrice = (price) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(price);

const Cart = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { cartItems, cartLoading, cartError, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState('');

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
                  const product = item.product;
                  if (!product) return null;
                  const productId = product._id;
                  const qty = item.quantity || 1;
                  const lineTotal = (product?.price ?? 0) * qty;
                  const isUpdating = updatingId === productId;

                  return (
                    <div key={productId} className={`cart-item ${isUpdating ? 'updating' : ''}`}>
                      <Link to={`/products/${productId}`} className="cart-item-image-wrap">
                        {product?.image ? (
                          <img src={product.image} alt={product.name} className="cart-item-image" />
                        ) : (
                          <div className="cart-item-placeholder">No image</div>
                        )}
                      </Link>
                      <div className="cart-item-details">
                        <Link to={`/products/${productId}`} className="cart-item-name">{product?.name}</Link>
                        <p className="cart-item-price">{formatPrice(product?.price ?? 0)} each</p>
                        <div className="cart-item-actions">
                          <div className="cart-item-qty">
                            <button
                              type="button"
                              className="cart-qty-btn"
                              onClick={() => handleQuantityChange(productId, qty - 1)}
                              disabled={qty <= 1 || isUpdating}
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="cart-qty-value">{qty}</span>
                            <button
                              type="button"
                              className="cart-qty-btn"
                              onClick={() => handleQuantityChange(productId, qty + 1)}
                              disabled={isUpdating}
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            className="cart-remove-btn"
                            onClick={() => handleRemove(productId)}
                            disabled={isUpdating}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="cart-item-total">{formatPrice(lineTotal)}</div>
                    </div>
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
                <button type="button" className="cart-cta cart-cta-primary" disabled>
                  Checkout (coming soon)
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
