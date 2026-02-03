import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './Products.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`/api/products/${id}`);
        setProduct(res.data.data);
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

  return (
    <div className="products-page">
      <Navbar />
      <main className="products-main">
        <div className="products-container">
          <Link to="/products" className="detail-back">← Back to products</Link>
          <div className="product-detail">
            <div className="product-detail-image-wrap">
              {product.image ? (
                <img src={product.image} alt={product.name} className="product-detail-image" />
              ) : (
                <div className="product-card-placeholder" style={{ minHeight: 320 }}>
                  <span className="placeholder-icon">📷</span>
                  <span>No image</span>
                </div>
              )}
            </div>
            <div className="product-detail-info">
              <span className="product-detail-category">{product.category}</span>
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
