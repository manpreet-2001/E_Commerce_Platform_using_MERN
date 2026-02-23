const express = require('express');
const router = express.Router({ mergeParams: true });
const Review = require('../models/Review');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/products/:productId/reviews
// @desc    Get all reviews for a product
// @access  Public
router.get('/', async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findById(productId).select('_id').lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const reviews = await Review.find({ product: productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const stats = reviews.length
      ? {
          average: Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10,
          count: reviews.length
        }
      : { average: 0, count: 0 };

    res.json({ success: true, data: reviews, stats });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    console.error('GET /api/products/:productId/reviews error:', error.message || error);
    res.status(500).json({ success: false, message: 'Failed to load reviews' });
  }
});

// @route   POST /api/products/:productId/reviews
// @desc    Create a review (logged-in user, typically customer)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const productId = req.params.productId;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    const product = await Product.findById(productId).select('_id').lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const numRating = rating != null ? Number(rating) : null;
    if (numRating == null || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    const trimmedComment = typeof comment === 'string' ? comment.trim() : '';

    const existing = await Review.findOne({ product: productId, user: userId }).lean();
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product. You can edit your review from your account.' });
    }

    const review = await Review.create({
      product: productId,
      user: userId,
      rating: Math.round(numRating),
      comment: trimmedComment
    });

    const populated = await Review.findById(review._id).populate('user', 'name').lean();
    res.status(201).json({ success: true, message: 'Review submitted.', data: populated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });
    }
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    console.error('POST /api/products/:productId/reviews error:', error.message || error);
    res.status(500).json({ success: false, message: 'Failed to submit review' });
  }
});

module.exports = router;
