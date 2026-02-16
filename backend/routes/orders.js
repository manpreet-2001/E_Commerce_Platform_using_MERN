const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/orders/vendor/mine
// @desc    Get orders that contain at least one product from the current vendor
// @access  Private (vendor, admin)
router.get('/vendor/mine', protect, authorize('vendor', 'admin'), async (req, res) => {
  try {
    const vendorId = req.user._id;
    const orders = await Order.find({ 'items.product': { $in: await getProductIdsByVendor(vendorId) } })
      .populate('user', 'name email')
      .populate({
        path: 'items.product',
        select: 'name price image vendor',
        populate: { path: 'vendor', select: 'name' }
      })
      .sort({ createdAt: -1 });

    const filtered = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.filter(
        (item) => item.product && item.product.vendor && item.product.vendor._id.toString() === vendorId.toString()
      );
      orderObj.vendorSubtotal = orderObj.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      return orderObj;
    });

    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (error) {
    console.error('GET /api/orders/vendor/mine error:', error.message || error);
    res.status(500).json({ success: false, message: 'Server error while fetching vendor orders' });
  }
});

async function getProductIdsByVendor(vendorId) {
  const products = await Product.find({ vendor: vendorId }).select('_id').lean();
  return products.map((p) => p._id);
}

// @route   POST /api/orders
// @desc    Create order from current user's cart
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'cart.product',
      select: 'name price stock vendor'
    });
    if (!user || !user.cart || user.cart.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const items = [];
    let totalAmount = 0;
    for (const entry of user.cart) {
      const product = entry.product;
      if (!product) continue;
      const qty = Math.max(1, parseInt(entry.quantity, 10) || 1);
      if (product.stock < qty) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for "${product.name}". Available: ${product.stock}`
        });
      }
      items.push({ product: product._id, quantity: qty, price: product.price });
      totalAmount += product.price * qty;
    }

    const shippingAddress = req.body.shippingAddress || {};
    const paymentMethod = (req.body.paymentMethod === 'card' ? 'card' : 'cod');
    const order = await Order.create({
      user: req.user.id,
      items,
      shippingAddress: {
        fullName: shippingAddress.fullName || user.name || '',
        address: shippingAddress.address || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        zip: shippingAddress.zip || '',
        country: shippingAddress.country || ''
      },
      totalAmount,
      status: 'pending',
      paymentMethod
    });

    await Product.bulkWrite(
      items.map((item) => ({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { stock: -item.quantity } }
        }
      }))
    );

    user.cart = [];
    await user.save();

    const populated = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate({ path: 'items.product', select: 'name price image vendor' });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: populated
    });
  } catch (error) {
    console.error('POST /api/orders error:', error.message || error);
    res.status(500).json({ success: false, message: 'Server error while creating order' });
  }
});

// @route   GET /api/orders
// @desc    Get current user's orders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate({ path: 'items.product', select: 'name price image' })
      .sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('GET /api/orders error:', error.message || error);
    res.status(500).json({ success: false, message: 'Server error while fetching orders' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order (owner, or vendor with items in order, or admin)
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate({ path: 'items.product', select: 'name price image vendor' });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const isOwner = order.user._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const vendorIds = [...new Set(order.items.map((i) => i.product?.vendor?.toString()).filter(Boolean))];
    const isVendor = req.user.role === 'vendor' && vendorIds.includes(req.user._id.toString());
    if (!isOwner && !isAdmin && !isVendor) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('GET /api/orders/:id error:', error.message || error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PATCH /api/orders/:id/cancel
// @desc    Cancel order (customer/owner only; only pending or confirmed)
// @access  Private
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const isOwner = order.user.toString() === req.user.id;
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });
    }
    const cancellable = ['pending', 'confirmed'];
    if (!cancellable.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled (current status: ${order.status})`
      });
    }
    await Product.bulkWrite(
      order.items.map((item) => ({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { stock: item.quantity } }
        }
      }))
    );
    order.status = 'cancelled';
    await order.save();
    const populated = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate({ path: 'items.product', select: 'name price image' });
    res.json({ success: true, message: 'Order cancelled', data: populated });
  } catch (error) {
    console.error('PATCH /api/orders/:id/cancel error:', error.message || error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PATCH /api/orders/:id/status
// @desc    Update order status (vendor for orders containing their products, or admin)
// @access  Private
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status required' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const productIds = await getProductIdsByVendor(req.user._id);
    const orderHasVendorProducts = order.items.some((i) => productIds.some((id) => id.equals(i.product)));
    const isVendor = req.user.role === 'vendor' && orderHasVendorProducts;

    if (!isAdmin && !isVendor) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
    }

    order.status = status;
    await order.save();
    const populated = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate({ path: 'items.product', select: 'name price image vendor' });
    res.json({ success: true, data: populated });
  } catch (error) {
    console.error('PATCH /api/orders/:id/status error:', error.message || error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
