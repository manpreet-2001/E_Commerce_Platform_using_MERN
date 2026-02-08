const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// @route   GET /api/cart
// @desc    Get current user's cart with product details
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('cart')
      .populate({
        path: 'cart.product',
        select: 'name price image category stock'
      });

    const cart = (user && user.cart) ? user.cart : [];
    res.json({
      success: true,
      data: cart,
      count: cart.length
    });
  } catch (error) {
    console.error('GET /api/cart error:', error.message || error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching cart'
    });
  }
});

// @route   POST /api/cart
// @desc    Add item to cart or update quantity if already in cart
// @access  Private
// @body    { productId, quantity }
router.post('/', protect, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'productId is required'
      });
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const user = await User.findById(req.user.id).select('cart');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const existing = user.cart.find(
      (item) => item.product.toString() === productId
    );
    if (existing) {
      existing.quantity += qty;
    } else {
      user.cart.push({ product: productId, quantity: qty });
    }

    await user.save();

    const updated = await User.findById(req.user.id)
      .select('cart')
      .populate({
        path: 'cart.product',
        select: 'name price image category stock'
      });

    res.status(200).json({
      success: true,
      message: 'Added to cart',
      data: updated.cart,
      count: updated.cart.length
    });
  } catch (error) {
    console.error('POST /api/cart error:', error.message || error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding to cart'
    });
  }
});

// @route   DELETE /api/cart (clear all) - must be before /:productId
// @desc    Clear entire cart
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('cart');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    user.cart = [];
    await user.save();
    res.json({
      success: true,
      message: 'Cart cleared',
      data: [],
      count: 0
    });
  } catch (error) {
    console.error('DELETE /api/cart (clear) error:', error.message || error);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing cart'
    });
  }
});

// @route   PUT /api/cart/:productId
// @desc    Update quantity for one cart item
// @access  Private
// @body    { quantity }
router.put('/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;
    const quantity = Math.max(0, parseInt(req.body.quantity, 10));

    const user = await User.findById(req.user.id).select('cart');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const item = user.cart.find(
      (i) => i.product.toString() === productId
    );
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not in cart'
      });
    }

    if (quantity === 0) {
      user.cart = user.cart.filter(
        (i) => i.product.toString() !== productId
      );
    } else {
      item.quantity = quantity;
    }

    await user.save();

    const updated = await User.findById(req.user.id)
      .select('cart')
      .populate({
        path: 'cart.product',
        select: 'name price image category stock'
      });

    res.json({
      success: true,
      message: 'Cart updated',
      data: updated.cart,
      count: updated.cart.length
    });
  } catch (error) {
    console.error('PUT /api/cart error:', error.message || error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating cart'
    });
  }
});

// @route   DELETE /api/cart/:productId
// @desc    Remove one item from cart
// @access  Private
router.delete('/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user.id).select('cart');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const before = user.cart.length;
    user.cart = user.cart.filter((i) => i.product.toString() !== productId);
    if (user.cart.length === before) {
      return res.status(404).json({
        success: false,
        message: 'Item not in cart'
      });
    }

    await user.save();

    const updated = await User.findById(req.user.id)
      .select('cart')
      .populate({
        path: 'cart.product',
        select: 'name price image category stock'
      });

    res.json({
      success: true,
      message: 'Item removed from cart',
      data: updated.cart,
      count: updated.cart.length
    });
  } catch (error) {
    console.error('DELETE /api/cart error:', error.message || error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing from cart'
    });
  }
});

module.exports = router;
