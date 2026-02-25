const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// @route   GET /api/wishlist
// @desc    Get current user's wishlist with product details
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate({
        path: 'products',
        select: 'name price image category stock',
        model: 'Product'
      })
      .lean();

    if (!wishlist) {
      return res.json({ success: true, data: [], productIds: [] });
    }

    const productIds = (wishlist.products || []).map((p) => (typeof p === 'object' && p._id ? p._id.toString() : p));
    const products = (wishlist.products || []).filter((p) => p && (p._id || p));

    res.json({
      success: true,
      data: products,
      productIds
    });
  } catch (error) {
    console.error('GET /api/wishlist error:', error.message || error);
    res.status(500).json({ success: false, message: 'Failed to load wishlist' });
  }
});

// @route   POST /api/wishlist
// @desc    Add a product to wishlist
// @access  Private
// @body    { productId }
router.post('/', protect, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }

    const product = await Product.findById(productId).select('_id').lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user._id,
        products: [productId]
      });
    } else {
      const exists = wishlist.products.some((id) => id.toString() === productId);
      if (exists) {
        return res.json({ success: true, message: 'Already in wishlist', productIds: wishlist.products.map((id) => id.toString()) });
      }
      wishlist.products.push(productId);
      await wishlist.save();
    }

    const productIds = wishlist.products.map((id) => id.toString());
    res.json({
      success: true,
      message: 'Added to wishlist',
      productIds
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    console.error('POST /api/wishlist error:', error.message || error);
    res.status(500).json({ success: false, message: 'Failed to add to wishlist' });
  }
});

// @route   DELETE /api/wishlist/:productId
// @desc    Remove a product from wishlist
// @access  Private
router.delete('/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;
    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.json({ success: true, message: 'Removed from wishlist', productIds: [] });
    }

    wishlist.products = wishlist.products.filter((id) => id.toString() !== productId);
    await wishlist.save();

    const productIds = wishlist.products.map((id) => id.toString());
    res.json({
      success: true,
      message: 'Removed from wishlist',
      productIds
    });
  } catch (error) {
    console.error('DELETE /api/wishlist/:productId error:', error.message || error);
    res.status(500).json({ success: false, message: 'Failed to remove from wishlist' });
  }
});

module.exports = router;
