const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    enum: {
      values: ['electronics', 'phones', 'laptops', 'accessories', 'audio', 'gaming', 'other'],
      message: '{VALUE} is not a valid category'
    }
  },
  image: {
    type: String,
    default: '',
    trim: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vendor is required']
  },
  stock: {
    type: Number,
    required: [true, 'Stock is required'],
    default: 0,
    min: [0, 'Stock cannot be negative']
  }
}, {
  timestamps: true
});

// Index for faster queries by category and vendor
productSchema.index({ category: 1 });
productSchema.index({ vendor: 1 });

module.exports = mongoose.model('Product', productSchema);
