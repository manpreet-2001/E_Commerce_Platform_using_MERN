import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';
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
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(price);
  };

  const formatCategory = (cat) => CATEGORY_LABELS[cat] || cat;

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
                  {cartMessage && (
                    <p className={`product-detail-cart-msg ${cartMessage.includes('Failed') || cartMessage.includes('sign in') ? 'error' : 'success'}`}>
                      {cartMessage}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
