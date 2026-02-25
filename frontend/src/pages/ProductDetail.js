import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import StarRating from '../components/StarRating';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getImageUrl } from '../utils/imageUrl';
import './Products.css';

const CATEGORY_LABELS = {
  electronics: 'Electronics',
  phones: 'Phones',
  laptops: 'Laptops',
  accessories: 'Accessories',
  audio: 'Audio',
  gaming: 'Gaming',
  other: 'Other'
};

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user, isAuthenticated, hasRole } = useAuth();
  const { isInWishlist, addToWishlist, removeFromWishlist, wishlistLoading } = useWishlist();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ average: 0, count: 0 });
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [wishlistToggling, setWishlistToggling] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`/api/products/${id}`);
        setProduct(res.data.data);
        setSelectedImageIndex(0);
      } catch (err) {
        setError(err.response?.data?.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  const fetchReviews = useCallback(async () => {
    if (!id) return;
    try {
      const res = await axios.get(`/api/products/${id}/reviews`);
      setReviews(res.data.data || []);
      setReviewStats(res.data.stats || { average: 0, count: 0 });
    } catch {
      setReviews([]);
      setReviewStats({ average: 0, count: 0 });
    }
  }, [id]);

  useEffect(() => {
    if (id && product) fetchReviews();
  }, [id, product, fetchReviews]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSubmitting(true);
    try {
      await axios.post(`/api/products/${id}/reviews`, { rating: reviewRating, comment: reviewComment.trim() });
      setReviewRating(5);
      setReviewComment('');
      await fetchReviews();
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!id || !hasRole?.('admin')) return;
    setDeletingReviewId(reviewId);
    try {
      await axios.delete(`/api/products/${id}/reviews/${reviewId}`);
      await fetchReviews();
    } catch {
      setReviewError('Failed to remove review.');
    } finally {
      setDeletingReviewId(null);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(price);
  };

  const formatCategory = (cat) => CATEGORY_LABELS[cat] || cat;

  const handleWishlistToggle = async () => {
    if (!isAuthenticated()) return;
    setWishlistToggling(true);
    try {
      if (isInWishlist(id)) {
        await removeFromWishlist(id);
      } else {
        await addToWishlist(id);
      }
    } finally {
      setWishlistToggling(false);
    }
  };

  const handleAddToCart = async () => {
    setCartMessage('');
    setAdding(true);
    const result = await addToCart(product._id, quantity);
    setAdding(false);
    setCartMessage(result.message || (result.success ? 'Added to cart!' : 'Could not add to cart'));
    if (result.success) setTimeout(() => setCartMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className="products-page">
        <Navbar />
        <div className="products-loading" style={{ minHeight: '60vh' }}>
          <div className="products-spinner" />
          <p>Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="products-page">
        <Navbar />
        <div className="products-main">
          <div className="products-error">
            <p>{error || 'Product not found'}</p>
            <Link to="/products" className="detail-back">← Back to products</Link>
          </div>
        </div>
      </div>
    );
  }

  const imagesArray = (Array.isArray(product.images) && product.images.length > 0)
    ? product.images.filter((u) => u && String(u).trim())
    : [];
  const primaryImage = product.image && String(product.image).trim() ? product.image.trim() : '';
  const imageList =
    imagesArray.length > 0
      ? imagesArray
      : primaryImage
        ? [primaryImage]
        : [];
  const mainImage = imageList[selectedImageIndex] || imageList[0];

  return (
    <div className="products-page">
      <Navbar />
      <main className="products-main">
        <div className="products-container">
          {/* Breadcrumb */}
          <nav className="detail-breadcrumb" aria-label="Breadcrumb">
            <Link to="/products">Products</Link>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{product.name}</span>
          </nav>
          <Link to="/products" className="detail-back">← Back to products</Link>

          <div className="product-detail">
            <div className="product-detail-gallery">
              <div className="product-detail-image-wrap">
                {mainImage ? (
                  <img
                    src={getImageUrl(mainImage)}
                    alt={product.name}
                    className="product-detail-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const placeholder = e.target.nextSibling;
                      if (placeholder) placeholder.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="product-card-placeholder" style={{ minHeight: 320, display: mainImage ? 'none' : 'flex' }}>
                  <span className="placeholder-icon">📷</span>
                  <span>No image</span>
                </div>
              </div>
              {imageList.length > 1 && (
                <div className="product-detail-thumbs" role="tablist" aria-label="Product images">
                  {imageList.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`product-detail-thumb-btn ${selectedImageIndex === i ? 'selected' : ''}`}
                      onClick={() => setSelectedImageIndex(i)}
                      aria-label={`View image ${i + 1}`}
                      aria-selected={selectedImageIndex === i}
                    >
                      <img src={getImageUrl(url)} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="product-detail-info">
              <span className="product-detail-category">{formatCategory(product.category)}</span>
              <h1 className="product-detail-title">{product.name}</h1>
              <p className="product-detail-price">{formatPrice(product.price)}</p>
              {product.description && (
                <p className="product-detail-desc">{product.description}</p>
              )}
              <p className="product-detail-stock">
                {product.stock > 0 ? (
                  <span className="in-stock">In stock ({product.stock} available)</span>
                ) : (
                  <span className="out-of-stock-text">Out of stock</span>
                )}
              </p>
              {product.vendor && (
                <p className="product-detail-vendor">Sold by {product.vendor.name}</p>
              )}

              {/* Quantity & Add to Cart */}
              {product.stock > 0 && (
                <div className="product-detail-actions">
                  <div className="detail-quantity">
                    <label htmlFor="quantity">Quantity</label>
                    <input
                      type="number"
                      id="quantity"
                      min={1}
                      max={product.stock}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value, 10) || 1)))}
                      className="detail-quantity-input"
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-add-to-cart"
                    onClick={handleAddToCart}
                    disabled={adding}
                  >
                    {adding ? 'Adding…' : 'Add to Cart'}
                  </button>
                  {isAuthenticated() && (
                    <button
                      type="button"
                      className={`product-detail-wishlist-btn ${isInWishlist(id) ? 'in-wishlist' : ''}`}
                      onClick={handleWishlistToggle}
                      disabled={wishlistToggling || wishlistLoading}
                      aria-label={isInWishlist(id) ? 'Remove from wishlist' : 'Add to wishlist'}
                      title={isInWishlist(id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <span className="product-detail-wishlist-icon" aria-hidden="true">
                        {isInWishlist(id) ? '♥' : '♡'}
                      </span>
                      {wishlistToggling ? '…' : isInWishlist(id) ? 'In wishlist' : 'Wishlist'}
                    </button>
                  )}
                  {cartMessage && (
                    <p className={`product-detail-cart-msg ${cartMessage.includes('Failed') || cartMessage.includes('sign in') ? 'error' : 'success'}`}>
                      {cartMessage}
                    </p>
                  )}
                </div>
              )}

              {/* Ratings & Reviews */}
              <section className="product-detail-reviews" aria-labelledby="reviews-heading">
                <h2 id="reviews-heading" className="product-detail-reviews-title">
                  Reviews {reviewStats.count > 0 && `(${reviewStats.count})`}
                </h2>
                {reviewStats.count > 0 && (
                  <p className="product-detail-reviews-avg">
                    <StarRating rating={reviewStats.average} className="star-rating-large" ariaLabel={`${reviewStats.average} out of 5 stars`} />
                    <span className="product-detail-reviews-avg-text">{reviewStats.average.toFixed(1)} average</span>
                  </p>
                )}

                {isAuthenticated() ? (
                  <form onSubmit={handleReviewSubmit} className="product-detail-review-form">
                    <p className="product-detail-review-form-title">Write a review</p>
                    {reviewError && <p className="product-detail-review-error" role="alert">{reviewError}</p>}
                    <div className="product-detail-review-rating">
                      <span className="product-detail-review-rating-label">Rating</span>
                      <StarRating
                        rating={reviewRating}
                        interactive
                        onChange={setReviewRating}
                        ariaLabel="Choose your rating"
                      />
                    </div>
                    <div className="product-detail-review-comment">
                      <label htmlFor="review-comment">Comment (optional)</label>
                      <textarea
                        id="review-comment"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your experience with this product..."
                        rows={3}
                        maxLength={2000}
                        className="product-detail-review-textarea"
                      />
                    </div>
                    <button type="submit" className="btn-add-to-cart product-detail-review-submit" disabled={reviewSubmitting}>
                      {reviewSubmitting ? 'Submitting…' : 'Submit review'}
                    </button>
                  </form>
                ) : (
                  <p className="product-detail-review-login">
                    <Link to="/login">Sign in</Link> to leave a review.
                  </p>
                )}

                {reviews.length > 0 ? (
                  <ul className="product-detail-review-list">
                    {reviews.map((r) => (
                      <li key={r._id} className="product-detail-review-item">
                        <div className="product-detail-review-item-header">
                          <StarRating rating={r.rating} ariaLabel={`${r.rating} out of 5 stars`} />
                          <span className="product-detail-review-item-meta">
                            {r.user?.name || 'Customer'} · {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}
                          </span>
                          {hasRole?.('admin') && (
                            <button
                              type="button"
                              className="product-detail-review-delete-btn"
                              onClick={() => handleDeleteReview(r._id)}
                              disabled={deletingReviewId === r._id}
                              aria-label="Remove review"
                            >
                              {deletingReviewId === r._id ? 'Removing…' : 'Remove'}
                            </button>
                          )}
                        </div>
                        {r.comment && <p className="product-detail-review-item-comment">{r.comment}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="product-detail-review-empty">No reviews yet. Be the first to review!</p>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
