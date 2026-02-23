const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, message: 'At least 8 characters' },
  { test: (p) => /[A-Z]/.test(p), message: 'One uppercase letter' },
  { test: (p) => /[a-z]/.test(p), message: 'One lowercase letter' },
  { test: (p) => /\d/.test(p), message: 'One number' },
  { test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p), message: 'One special character' },
];

function validatePasswordStrength(password) {
  const p = (password || '').trim();
  const failed = PASSWORD_RULES.filter((r) => !r.test(p)).map((r) => r.message);
  return failed.length === 0 ? null : failed;
}

// @route   POST /api/users
// @desc    Create a user (admin only). Body: name, email, password, role.
// @access  Private (admin)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const trimmedName = (name || '').trim();
    const trimmedEmail = (email || '').trim().toLowerCase();
    const trimmedPassword = (password || '').trim();

    if (!trimmedName || trimmedName.length < 2) {
      return res.status(400).json({ success: false, message: 'Name is required (at least 2 characters).' });
    }
    if (!trimmedEmail) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const passwordErrors = validatePasswordStrength(trimmedPassword);
    if (passwordErrors) {
      return res.status(400).json({
        success: false,
        message: `Password must have: ${passwordErrors.join('; ')}`
      });
    }

    const normalizedRole = (role && typeof role === 'string') ? role.trim().toLowerCase() : 'customer';
    if (!['customer', 'vendor', 'admin'].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be customer, vendor, or admin.'
      });
    }

    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password: trimmedPassword,
      role: normalizedRole
    });

    const data = await User.findById(user._id).select('name email role isBlocked createdAt').lean();
    res.status(201).json({ success: true, message: 'User created successfully', data });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }
    console.error('POST /api/users error:', error.message || error);
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
});

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

// @route   PUT /api/users/:id
// @desc    Update a user (admin only). Body: name, email, role, newPassword (optional). Cannot change own role.
// @access  Private (admin)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, newPassword } = req.body;
    const isSelf = req.user._id.toString() === id;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updates = {};

    if (name !== undefined) {
      const trimmed = (name || '').trim();
      if (trimmed.length < 2) {
        return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' });
      }
      updates.name = trimmed;
    }

    if (email !== undefined) {
      const trimmed = (email || '').trim().toLowerCase();
      if (!trimmed) {
        return res.status(400).json({ success: false, message: 'Email is required.' });
      }
      if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
      }
      const existing = await User.findOne({ email: trimmed }).select('_id').lean();
      if (existing && existing._id.toString() !== id) {
        return res.status(400).json({ success: false, message: 'This email is already in use.' });
      }
      updates.email = trimmed;
    }

    if (role !== undefined && !isSelf) {
      const normalizedRole = (typeof role === 'string') ? role.trim().toLowerCase() : '';
      if (!['customer', 'vendor', 'admin'].includes(normalizedRole)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be customer, vendor, or admin.'
        });
      }
      updates.role = normalizedRole;
    }

    if (newPassword !== undefined && newPassword !== '') {
      const pwdErrors = validatePasswordStrength(newPassword);
      if (pwdErrors) {
        return res.status(400).json({
          success: false,
          message: `New password must have: ${pwdErrors.join('; ')}`
        });
      }
      user.password = newPassword.trim();
      await user.save();
    }

    if (Object.keys(updates).length > 0) {
      await User.findByIdAndUpdate(id, updates, { runValidators: true });
    }

    const updated = await User.findById(id).select('name email role isBlocked createdAt').lean();
    res.json({ success: true, data: updated, message: 'User updated' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'This email is already in use.' });
    }
    console.error('PUT /api/users/:id error:', error.message || error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user (admin only). Cannot delete yourself.
// @access  Private (admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user._id.toString() === id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('DELETE /api/users/:id error:', error.message || error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

module.exports = router;
