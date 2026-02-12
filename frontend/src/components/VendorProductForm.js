import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUrl';
import './VendorProductForm.css';

const CATEGORIES = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'phones', label: 'Phones' },
  { value: 'laptops', label: 'Laptops' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'audio', label: 'Audio' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'other', label: 'Other' },
];

const ACCEPT_IMAGES = 'image/jpeg,image/jpg,image/png,image/gif,image/webp';
const MAX_SIZE_MB = 5;

const VendorProductForm = ({ product, onSubmit, onCancel, loading, error }) => {
  const isEdit = !!product;
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'electronics',
    image: '',
    stock: '0',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price ?? '',
        category: product.category || 'electronics',
        image: product.image || '',
        stock: product.stock ?? '0',
      });
      setImagePreview(product.image || null);
      setImageFile(null);
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'electronics',
        image: '',
        stock: '0',
      });
      setImagePreview(null);
      setImageFile(null);
    }
  }, [product]);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return;
    }
    setImageFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearImage = () => {
    setImageFile(null);
    if (!product?.image) setImagePreview(null);
    else setImagePreview(product.image);
    setFormData((prev) => ({ ...prev, image: product?.image || '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let imageUrl = formData.image?.trim() || '';

    if (imageFile) {
      try {
        const fd = new FormData();
        fd.append('image', imageFile);
        const res = await axios.post('/api/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data?.url) imageUrl = res.data.url;
      } catch (err) {
        const msg = err.response?.data?.message || 'Image upload failed';
        onSubmit({ imageError: msg });
        return;
      }
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      category: formData.category,
      image: imageUrl,
      stock: parseInt(formData.stock, 10) || 0,
    };
    onSubmit(payload);
  };

  const displayPreview = imagePreview || formData.image;

  return (
    <form className="vendor-product-form" onSubmit={handleSubmit}>
      <h3 className="vendor-product-form-title">{isEdit ? 'Edit Product' : 'Add Product'}</h3>
      {error && <div className="vendor-product-form-error">{error}</div>}

      <div className="vendor-product-form-group">
        <label htmlFor="vendor-product-name">Name *</label>
        <input
          id="vendor-product-name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="Product name"
          required
          minLength={2}
          maxLength={200}
        />
      </div>

      <div className="vendor-product-form-group">
        <label htmlFor="vendor-product-description">Description</label>
        <textarea
          id="vendor-product-description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Product description"
          rows={3}
          maxLength={2000}
        />
      </div>

      <div className="vendor-product-form-row">
        <div className="vendor-product-form-group">
          <label htmlFor="vendor-product-price">Price *</label>
          <input
            id="vendor-product-price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={handleChange}
            placeholder="0.00"
            required
          />
        </div>
        <div className="vendor-product-form-group">
          <label htmlFor="vendor-product-stock">Stock *</label>
          <input
            id="vendor-product-stock"
            name="stock"
            type="number"
            min="0"
            value={formData.stock}
            onChange={handleChange}
            placeholder="0"
            required
          />
        </div>
      </div>

      <div className="vendor-product-form-group">
        <label htmlFor="vendor-product-category">Category *</label>
        <select
          id="vendor-product-category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div className="vendor-product-form-group">
        <label>Product image</label>
        <p className="vendor-product-form-hint">JPEG, PNG, GIF or WebP. Max {MAX_SIZE_MB}MB.</p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_IMAGES}
          onChange={handleFileChange}
          className="vendor-product-form-file-input"
          aria-label="Choose image"
        />
        {displayPreview && (
          <div className="vendor-product-form-preview-wrap">
            <img
              src={getImageUrl(displayPreview)}
              alt="Preview"
              className="vendor-product-form-preview"
            />
            <button
              type="button"
              className="vendor-product-form-preview-remove"
              onClick={clearImage}
              aria-label="Remove image"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <div className="vendor-product-form-actions">
        <button type="button" className="vendor-product-form-btn vendor-product-form-btn-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="vendor-product-form-btn vendor-product-form-btn-submit" disabled={loading}>
          {loading ? <span className="vendor-product-form-spinner" /> : (isEdit ? 'Update' : 'Add')}
        </button>
      </div>
    </form>
  );
};

export default VendorProductForm;
