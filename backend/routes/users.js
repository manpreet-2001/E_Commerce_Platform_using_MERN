const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/users
// @desc    List all users (admin only). Optional: ?role=customer|vendor|admin, ?search=term (name/email)
// @access  Private (admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};

    if (role && ['customer', 'vendor', 'admin'].includes(role)) {
      filter.role = role;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('name email role isBlocked createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('GET /api/users error:', error.message || error);
    res.status(500).json({ success: false, message: 'Failed to load users' });
  }
});

// @route   PATCH /api/users/:id/block
// @desc    Block a user (admin only). Admin cannot block themselves.
// @access  Private (admin)
router.patch('/:id/block', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user._id.toString() === id) {
      return res.status(400).json({ success: false, message: 'You cannot block your own account' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isBlocked: true },
      { new: true, runValidators: true }
    ).select('name email role isBlocked').lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user, message: 'User blocked' });
  } catch (error) {
    console.error('PATCH /api/users/:id/block error:', error.message || error);
    res.status(500).json({ success: false, message: 'Failed to block user' });
  }
});

// @route   PATCH /api/users/:id/unblock
// @desc    Unblock a user (admin only)
// @access  Private (admin)
router.patch('/:id/unblock', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { isBlocked: false },
      { new: true, runValidators: true }
    ).select('name email role isBlocked').lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user, message: 'User unblocked' });
  } catch (error) {
    console.error('PATCH /api/users/:id/unblock error:', error.message || error);
    res.status(500).json({ success: false, message: 'Failed to unblock user' });
  }
});

// @route   PATCH /api/users/:id/role
// @desc    Update a user's role (admin only). Admin cannot change their own role.
// @access  Private (admin)
router.patch('/:id/role', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (req.user._id.toString() === id) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role' });
    }

    const validRoles = ['customer', 'vendor', 'admin'];
    const newRole = typeof role === 'string' ? role.trim().toLowerCase() : '';
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be customer, vendor, or admin.'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role: newRole },
      { new: true, runValidators: true }
    ).select('name email role isBlocked').lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user, message: 'Role updated' });
  } catch (error) {
    console.error('PATCH /api/users/:id/role error:', error.message || error);
    res.status(500).json({ success: false, message: 'Failed to update role' });
  }
});

module.exports = router;
