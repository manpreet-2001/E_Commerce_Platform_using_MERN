import React from 'react';
import { Link } from 'react-router-dom';
import './CartItem.css';

const formatPrice = (price) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(price);

const CartItem = ({ item, onQuantityChange, onRemove, isUpdating }) => {
  const product = item?.product;
  if (!product) return null;

  const productId = product._id;
  const qty = item.quantity || 1;
  const lineTotal = (product.price ?? 0) * qty;

  return (
    <div className={`cart-item ${isUpdating ? 'updating' : ''}`}>
      <Link to={`/products/${productId}`} className="cart-item-image-wrap">
        {product.image ? (
          <img src={product.image} alt={product.name} className="cart-item-image" />
        ) : (
          <div className="cart-item-placeholder">No image</div>
        )}
      </Link>
      <div className="cart-item-details">
        <Link to={`/products/${productId}`} className="cart-item-name">{product.name}</Link>
        <p className="cart-item-price">{formatPrice(product.price ?? 0)} each</p>
        <div className="cart-item-actions">
          <div className="cart-item-qty">
            <button
              type="button"
              className="cart-qty-btn"
              onClick={() => onQuantityChange(productId, qty - 1)}
              disabled={qty <= 1 || isUpdating}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="cart-qty-value">{qty}</span>
            <button
              type="button"
              className="cart-qty-btn"
              onClick={() => onQuantityChange(productId, qty + 1)}
              disabled={isUpdating}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="cart-remove-btn"
            onClick={() => onRemove(productId)}
            disabled={isUpdating}
          >
            Remove
          </button>
        </div>
      </div>
      <div className="cart-item-total">{formatPrice(lineTotal)}</div>
    </div>
  );
};

export default CartItem;
