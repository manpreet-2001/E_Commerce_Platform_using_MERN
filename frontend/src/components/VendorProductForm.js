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
const CATEGORY_VALUES = CATEGORIES.map((c) => c.value);

/** Normalize API product into form field values. Supports both image (single) and images (array). */
function getInitialFormData(product) {
  if (!product) {
    return {
      name: '',
      description: '',
      price: '',
      category: 'electronics',
      images: [],
      stock: '0',
    };
  }
  const category = product.category && CATEGORY_VALUES.includes(product.category)
    ? product.category
    : 'electronics';
  const price = product.price != null && product.price !== ''
    ? String(Number(product.price))
    : '';
  const stock = product.stock != null && product.stock !== ''
    ? String(Math.max(0, Math.floor(Number(product.stock))))
    : '0';
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images.map((s) => String(s).trim()).filter(Boolean)
    : product.image
      ? [String(product.image).trim()]
      : [];
  return {
    name: product.name != null ? String(product.name).trim() : '',
    description: product.description != null ? String(product.description) : '',
    price,
    category,
    images,
    stock,
  };
}

const MAX_IMAGES = 10;

const VendorProductForm = ({ product, onSubmit, onCancel, loading, error }) => {
  const isEdit = !!product;
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState(() => getInitialFormData(product));
  const [imageFiles, setImageFiles] = useState([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState([]);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);

  useEffect(() => {
    const initial = getInitialFormData(product);
    setFormData(initial);
    setImageFiles([]);
    setFilePreviewUrls([]);
    setSelectedPreviewIndex(0);
  }, [product?._id]);

  useEffect(() => {
    if (imageFiles.length === 0) {
      setFilePreviewUrls([]);
      return;
    }
    const urls = imageFiles.map((f) => URL.createObjectURL(f));
    setFilePreviewUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [imageFiles]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const valid = files.filter((file) => {
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) return false;
      if (file.size > MAX_SIZE_MB * 1024 * 1024) return false;
      return true;
    });
    const currentUrls = formData.images || [];
    const total = currentUrls.length + imageFiles.length + valid.length;
    if (valid.length > 0 && total <= MAX_IMAGES) {
      setImageFiles((prev) => [...prev, ...valid].slice(0, MAX_IMAGES - currentUrls.length));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeExistingImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
  };

  const removeNewImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setFormData((prev) => ({ ...prev, images: [] }));
    setImageFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const existingUrls = (formData.images || []).map((s) => s.trim()).filter(Boolean);
    let uploadedUrls = [];

    if (imageFiles.length > 0) {
      try {
        for (const file of imageFiles) {
          const fd = new FormData();
          fd.append('image', file);
          const res = await axios.post('/api/upload', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (res.data?.url) uploadedUrls.push(res.data.url);
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Image upload failed';
        onSubmit({ imageError: msg });
        return;
      }
    }

    const allImages = [...existingUrls, ...uploadedUrls];

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      category: formData.category,
      images: allImages,
      stock: parseInt(formData.stock, 10) || 0,
    };
    onSubmit(payload);
  };

  const existingImages = formData.images || [];
  const hasAnyImages = existingImages.length > 0 || imageFiles.length > 0;

  const galleryItems = [
    ...existingImages.map((url, i) => ({ type: 'existing', url: getImageUrl(url), index: i })),
    ...filePreviewUrls.map((url, i) => ({ type: 'new', url, index: i })),
  ];

  const totalImages = existingImages.length + filePreviewUrls.length;
  useEffect(() => {
    if (totalImages > 0 && selectedPreviewIndex >= totalImages) {
      setSelectedPreviewIndex(totalImages - 1);
    }
  }, [totalImages]);

  const mainPreview = galleryItems[selectedPreviewIndex];

  return (
    <form className="vendor-product-form" onSubmit={handleSubmit}>
      {error && <div className="vendor-product-form-error" role="alert">{error}</div>}

      <section className="vendor-product-form-section" aria-labelledby="vendor-product-details-heading">
        <h3 id="vendor-product-details-heading" className="vendor-product-form-section-title">Product details</h3>
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
      </section>

      <section className="vendor-product-form-section" aria-labelledby="vendor-product-pricing-heading">
        <h3 id="vendor-product-pricing-heading" className="vendor-product-form-section-title">Pricing & stock</h3>
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
      </section>

      <section className="vendor-product-form-section" aria-labelledby="vendor-product-image-heading">
        <h3 id="vendor-product-image-heading" className="vendor-product-form-section-title">Product images</h3>
      <div className="vendor-product-form-group">
        <label htmlFor="vendor-product-image-input">Image files</label>
        <p className="vendor-product-form-hint">JPEG, PNG, GIF or WebP. Max {MAX_SIZE_MB}MB per file. Up to {MAX_IMAGES} images.</p>
        <input
          id="vendor-product-image-input"
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_IMAGES}
          multiple
          onChange={handleFileChange}
          className="vendor-product-form-file-input"
          aria-label="Choose images"
        />
        {hasAnyImages && (
          <div className="vendor-product-form-gallery">
            <div className="vendor-product-form-gallery-main">
              {mainPreview && (
                <img
                  src={mainPreview.url}
                  alt="Preview"
                  className="vendor-product-form-gallery-main-img"
                />
              )}
            </div>
            <div className="vendor-product-form-gallery-thumbs" role="tablist" aria-label="Image thumbnails">
              {galleryItems.map((item, globalIndex) => (
                <div
                  key={item.type === 'existing' ? `existing-${item.index}` : `new-${item.index}`}
                  className={`vendor-product-form-gallery-thumb-wrap ${selectedPreviewIndex === globalIndex ? 'selected' : ''}`}
                >
                  <button
                    type="button"
                    className="vendor-product-form-gallery-thumb-btn"
                    onClick={() => setSelectedPreviewIndex(globalIndex)}
                    aria-label={`View image ${globalIndex + 1}`}
                    aria-selected={selectedPreviewIndex === globalIndex}
                  >
                    <img src={item.url} alt="" className="vendor-product-form-gallery-thumb" />
                  </button>
                  <button
                    type="button"
                    className="vendor-product-form-preview-remove vendor-product-form-gallery-thumb-remove"
                    onClick={() => (item.type === 'existing' ? removeExistingImage(item.index) : removeNewImage(item.index))}
                    aria-label={`Remove image ${globalIndex + 1}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {hasAnyImages && (
          <button
            type="button"
            className="vendor-product-form-clear-images"
            onClick={clearAllImages}
          >
            Clear all images
          </button>
        )}
      </div>
      </section>

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
