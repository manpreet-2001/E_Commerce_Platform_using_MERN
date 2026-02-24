const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/reviews/vendor/mine
// @desc    List reviews for the current vendor's products (read-only)
// @access  Private (vendor, admin)
router.get('/vendor/mine', protect, authorize('vendor', 'admin'), async (req, res) => {
  try {
    const productIds = await Product.find({ vendor: req.user._id }).distinct('_id');
    const reviews = await Review.find({ product: { $in: productIds } })
      .populate('product', 'name')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error('GET /api/reviews/vendor/mine error:', error.message || error);
    res.status(500).json({ success: false, message: 'Failed to load reviews' });
  }
});

// @route   GET /api/reviews/admin
// @desc    List all reviews on the platform (admin: full CRUD)
// @access  Private (admin)
router.get('/admin', protect, authorize('admin'), async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate('product', 'name vendor')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error('GET /api/reviews/admin error:', error.message || error);
    res.status(500).json({ success: false, message: 'Failed to load reviews' });
  }
});

module.exports = router;
