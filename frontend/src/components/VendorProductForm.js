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

function getOrderedItemsFromProduct(product) {
  if (!product) return [];
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images.map((s) => String(s).trim()).filter(Boolean)
    : product.image
      ? [String(product.image).trim()]
      : [];
  return images.map((url) => ({ type: 'existing', url }));
}

const VendorProductForm = ({ product, onSubmit, onCancel, loading, error }) => {
  const isEdit = !!product;
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState(() => getInitialFormData(product));
  const [orderedImageItems, setOrderedImageItems] = useState(() => getOrderedItemsFromProduct(product));
  const [filePreviewUrls, setFilePreviewUrls] = useState([]);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);

  useEffect(() => {
    const initial = getInitialFormData(product);
    setFormData(initial);
    setOrderedImageItems(getOrderedItemsFromProduct(product));
    setSelectedPreviewIndex(0);
  }, [product?._id]);

  useEffect(() => {
    const newFiles = orderedImageItems.filter((x) => x.type === 'new').map((x) => x.file);
    if (newFiles.length === 0) {
      setFilePreviewUrls([]);
      return;
    }
    const urls = newFiles.map((f) => URL.createObjectURL(f));
    setFilePreviewUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [orderedImageItems]);

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
    if (valid.length > 0 && orderedImageItems.length + valid.length <= MAX_IMAGES) {
      setOrderedImageItems((prev) => [...prev, ...valid.map((file) => ({ type: 'new', file }))]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImageAt = (globalIndex) => {
    setOrderedImageItems((prev) => prev.filter((_, i) => i !== globalIndex));
    setSelectedPreviewIndex((prev) => {
      if (prev === globalIndex) return prev === 0 ? 0 : prev - 1;
      return prev > globalIndex ? prev - 1 : prev;
    });
  };

  const moveImage = (index, direction) => {
    if (direction === 'up' && index <= 0) return;
    if (direction === 'down' && index >= orderedImageItems.length - 1) return;
    const swap = direction === 'up' ? index - 1 : index + 1;
    setOrderedImageItems((prev) => {
      const next = [...prev];
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
    setSelectedPreviewIndex((prev) => (prev === index ? swap : prev === swap ? index : prev));
  };

  const clearAllImages = () => {
    setOrderedImageItems([]);
    setSelectedPreviewIndex(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newFiles = orderedImageItems.filter((i) => i.type === 'new').map((i) => i.file);
    let uploadedUrls = [];

    if (newFiles.length > 0) {
      try {
        if (newFiles.length === 1) {
          const fd = new FormData();
          fd.append('image', newFiles[0]);
          const res = await axios.post('/api/upload', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (res.data?.url) uploadedUrls.push(res.data.url);
        } else {
          const fd = new FormData();
          newFiles.forEach((file) => fd.append('images', file));
          const res = await axios.post('/api/upload/multiple', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (Array.isArray(res.data?.urls)) uploadedUrls = res.data.urls;
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Image upload failed';
        onSubmit({ imageError: msg });
        return;
      }
    }

    let newIndex = 0;
    const allUrls = orderedImageItems.map((item) =>
      item.type === 'existing' ? item.url : uploadedUrls[newIndex++]
    ).filter(Boolean);

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      category: formData.category,
      images: allUrls,
      stock: parseInt(formData.stock, 10) || 0,
    };
    onSubmit(payload);
  };

  const hasAnyImages = orderedImageItems.length > 0;

  const galleryItems = orderedImageItems.map((item, i) => {
    const newIndex = orderedImageItems.slice(0, i).filter((x) => x.type === 'new').length;
    const displayUrl =
      item.type === 'existing' ? getImageUrl(item.url) : filePreviewUrls[newIndex] || '';
    return { type: item.type, url: displayUrl, index: i };
  });

  const totalImages = orderedImageItems.length;
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
        <p className="vendor-product-form-hint">JPEG, PNG, GIF or WebP. Max {MAX_SIZE_MB}MB per file. Up to {MAX_IMAGES} images. Use ↑ ↓ to reorder; first image is the main product image.</p>
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
                  <div className="vendor-product-form-gallery-thumb-actions">
                    <button
                      type="button"
                      className="vendor-product-form-gallery-move-btn"
                      onClick={() => moveImage(globalIndex, 'up')}
                      disabled={globalIndex === 0}
                      aria-label={`Move image ${globalIndex + 1} up`}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="vendor-product-form-gallery-move-btn"
                      onClick={() => moveImage(globalIndex, 'down')}
                      disabled={globalIndex === totalImages - 1}
                      aria-label={`Move image ${globalIndex + 1} down`}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="vendor-product-form-preview-remove vendor-product-form-gallery-thumb-remove"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeImageAt(globalIndex);
                      }}
                      aria-label={`Remove image ${globalIndex + 1}`}
                    >
                      Remove
                    </button>
                  </div>
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
