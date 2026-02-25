import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../utils/imageUrl';
import './Wishlist.css';

const formatPrice = (price) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(price);

const Wishlist = () => {
  const { wishlistItems, wishlistLoading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [removingId, setRemovingId] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [message, setMessage] = useState('');

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    setMessage('');
    await removeFromWishlist(productId);
    setRemovingId(null);
  };

  const handleAddToCart = async (productId, e) => {
    e?.preventDefault?.();
    setAddingId(productId);
    setMessage('');
    const result = await addToCart(productId, 1);
    setMessage(result.success ? 'Added to cart' : result.message || 'Could not add to cart');
    setAddingId(null);
  };

  return (
    <div className="wishlist-page">
      <Navbar />

      <main className="wishlist-main">
        <div className="wishlist-container">
          <h1 className="wishlist-title">Your Wishlist</h1>
          <p className="wishlist-subtitle">Items you saved for later</p>

          {message && (
            <div className={`wishlist-message ${message.includes('Added') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          {wishlistLoading ? (
            <div className="wishlist-loading">
              <div className="wishlist-spinner" />
              <p>Loading wishlist...</p>
            </div>
          ) : wishlistItems.length === 0 ? (
            <div className="wishlist-empty">
              <span className="wishlist-empty-icon" aria-hidden="true">♥</span>
              <h2>Your wishlist is empty</h2>
              <p>Save items you like by clicking the heart on product pages or in the shop.</p>
              <Link to="/products" className="wishlist-cta">Browse products</Link>
            </div>
          ) : (
            <ul className="wishlist-list">
              {wishlistItems.map((product) => {
                const id = product._id || product;
                const name = product.name || 'Product';
                const price = product.price ?? 0;
                const stock = product.stock ?? 0;
                const inStock = stock > 0;
                return (
                  <li key={id} className="wishlist-item">
                    <Link to={`/products/${id}`} className="wishlist-item-image-link">
                      {product.image ? (
                        <img src={getImageUrl(product.image)} alt="" className="wishlist-item-image" />
                      ) : (
                        <div className="wishlist-item-placeholder">No image</div>
                      )}
                    </Link>
                    <div className="wishlist-item-details">
                      <Link to={`/products/${id}`} className="wishlist-item-name">{name}</Link>
                      <p className="wishlist-item-price">{formatPrice(price)}</p>
                      <div className="wishlist-item-actions">
                        <button
                          type="button"
                          className="wishlist-btn wishlist-btn-cart"
                          onClick={(e) => handleAddToCart(id, e)}
                          disabled={!inStock || addingId === id}
                        >
                          {addingId === id ? 'Adding…' : 'Add to Cart'}
                        </button>
                        <button
                          type="button"
                          className="wishlist-btn wishlist-btn-remove"
                          onClick={() => handleRemove(id)}
                          disabled={removingId === id}
                        >
                          {removingId === id ? 'Removing…' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {wishlistItems.length > 0 && (
            <div className="wishlist-footer">
              <Link to="/products" className="wishlist-cta wishlist-cta-secondary">Continue shopping</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Wishlist;
