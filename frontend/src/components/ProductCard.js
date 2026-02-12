import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../utils/imageUrl';

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(price);
};

const ProductCard = ({ product, getCategoryLabel }) => {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const categoryLabel = getCategoryLabel ? getCategoryLabel(product.category) : product.category;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding || (product.stock !== undefined && product.stock < 1)) return;
    setAdding(true);
    await addToCart(product._id, 1);
    setAdding(false);
  };

  return (
    <article className="product-card">
      <Link to={`/products/${product._id}`} className="product-card-link">
        <div className="product-card-image-wrap">
          {product.image ? (
            <img
              src={getImageUrl(product.image)}
              alt={product.name}
              className="product-card-image"
            />
          ) : (
            <div className="product-card-placeholder">
              <span className="placeholder-icon">📷</span>
              <span>No image</span>
            </div>
          )}
          {product.stock !== undefined && product.stock < 10 && product.stock > 0 && (
            <span className="product-badge low-stock">Low stock</span>
          )}
          {product.stock === 0 && (
            <span className="product-badge out-of-stock">Out of stock</span>
          )}
        </div>
        <div className="product-card-body">
          <span className="product-card-category">{categoryLabel}</span>
          <h2 className="product-card-title">{product.name}</h2>
          {product.description && (
            <p className="product-card-desc">
              {product.description.slice(0, 80)}
              {product.description.length > 80 ? '…' : ''}
            </p>
          )}
          <div className="product-card-footer">
            <span className="product-card-price">{formatPrice(product.price)}</span>
            <span className="product-card-cta">View details →</span>
          </div>
          {product.stock !== undefined && product.stock > 0 && (
            <button
              type="button"
              className="product-card-add"
              onClick={handleAddToCart}
              disabled={adding}
            >
              {adding ? 'Adding…' : 'Add to Cart'}
            </button>
          )}
        </div>
      </Link>
    </article>
  );
};

export default ProductCard;
