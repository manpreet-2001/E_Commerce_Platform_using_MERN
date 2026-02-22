const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { protect, authorize } = require('../middleware/auth');

const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, message: 'At least 8 characters' },
  { test: (p) => /[A-Z]/.test(p), message: 'One uppercase letter' },
  { test: (p) => /[a-z]/.test(p), message: 'One lowercase letter' },
  { test: (p) => /\d/.test(p), message: 'One number' },
  { test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p), message: 'One special character (!@#$%^&* etc.)' },
];

function validatePasswordStrength(password) {
  const p = (password || '').trim();
  const failed = PASSWORD_RULES.filter((r) => !r.test(p)).map((r) => r.message);
  return failed.length === 0 ? null : failed;
}

// @route   GET /api/auth/check-email
// @desc    Check if email is available (not already registered)
// @access  Public
// @query   email - email to check
router.get('/check-email', async (req, res) => {
  try {
    const raw = (req.query.email || '').trim().toLowerCase();
    if (!raw) {
      return res.json({ success: true, available: false, message: 'Please enter an email address' });
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(raw)) {
      return res.json({ success: true, available: false, message: 'Please enter a valid email address' });
    }
    const existing = await User.findOne({ email: raw }).select('_id').lean();
    return res.json({
      success: true,
      available: !existing,
      message: existing ? 'This email is already registered' : 'Email is available'
    });
  } catch (error) {
    console.error('GET /api/auth/check-email error:', error.message || error);
    res.status(500).json({ success: false, message: 'Unable to check email' });
  }
});

// @route   GET /api/auth/vendors
// @desc    List all vendors (admin only) for filter dropdowns
// @access  Private (admin)
router.get('/vendors', protect, authorize('admin'), async (req, res) => {
  try {
    const vendors = await User.find({ role: 'vendor' })
      .select('_id name email')
      .sort({ name: 1 })
      .lean();
    res.json({ success: true, data: vendors });
  } catch (error) {
    console.error('GET /api/auth/vendors error:', error.message || error);
    res.status(500).json({ success: false, message: 'Server error while fetching vendors' });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    const trimmedPassword = (password || '').trim();
    const passwordErrors = validatePasswordStrength(trimmedPassword);
    if (passwordErrors) {
      return res.status(400).json({
        success: false,
        message: `Password must have: ${passwordErrors.join('; ')}`
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Normalize role to lowercase (enum expects customer, vendor, admin)
    const normalizedRole = (role && typeof role === 'string') ? role.trim().toLowerCase() : 'customer';
    if (!['customer', 'vendor', 'admin'].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be customer, vendor, or admin.'
      });
    }

    // Create new user (trim password so login with trimmed input matches)
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: trimmedPassword,
      role: normalizedRole
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    // Handle MongoDB duplicate key (email already exists)
    if (error.code === 11000 || (error.message && error.message.includes('E11000'))) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Log full error for debugging
    console.error('Registration error:', error.message);
    if (process.env.NODE_ENV !== 'production') {
      console.error(error.stack);
    }

    // Return user-friendly message for known issues
    let message = 'Server error during registration. Check server logs.';
    if (error.message && error.message.includes('JWT_SECRET')) {
      message = 'Server misconfiguration: JWT_SECRET is not set. Create a .env file with JWT_SECRET (see .env.example).';
    } else if (error.name === 'MongoServerError' || error.message && error.message.includes('Mongo')) {
      message = 'Database error. Make sure MongoDB is running and MONGODB_URI is correct in .env.';
    }

    res.status(500).json({
      success: false,
      message
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const normalizedEmail = (email || '').trim().toLowerCase();
    const trimmedPassword = (password || '').trim();
    if (!normalizedEmail || !trimmedPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    // Find user (email match is case-insensitive, same as register)
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Login] No user found for email:', normalizedEmail);
      }
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check password (use trimmed to match frontend and registration)
    const isMatch = await user.comparePassword(trimmedPassword);
    if (!isMatch) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Login] Password mismatch for:', normalizedEmail);
      }
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact support.'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('POST /api/auth/login error:', error.message || error);
    if (process.env.NODE_ENV !== 'production') console.error(error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// @route   POST /api/auth/dev-set-password
// @desc    (DEV ONLY) Set a new password for an existing user by email. Use when login fails due to unknown/old password.
// @access  Public, only when NODE_ENV !== 'production'
router.post('/dev-set-password', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  try {
    const { email, newPassword } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();
    const trimmedPassword = (newPassword || '').trim();
    if (!normalizedEmail || !trimmedPassword) {
      return res.status(400).json({
        success: false,
        message: 'Provide email and newPassword'
      });
    }
    const passwordErrors = validatePasswordStrength(trimmedPassword);
    if (passwordErrors) {
      return res.status(400).json({
        success: false,
        message: `Password must have: ${passwordErrors.join('; ')}`
      });
    }
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found for that email'
      });
    }
    user.password = trimmedPassword;
    await user.save(); // pre('save') hashes the password
    console.log('[Dev] Password updated for:', normalizedEmail);
    res.json({
      success: true,
      message: 'Password updated. You can now log in with that email and the new password.'
    });
  } catch (error) {
    console.error('POST /api/auth/dev-set-password error:', error.message || error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('GET /api/auth/me error:', error.message || error);
    if (process.env.NODE_ENV !== 'production') console.error(error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update current user profile (name, email). At least one field required.
// @access  Private
// @body    { name?, email? } - both optional but at least one must be provided
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    const { name, email } = req.body;
    const hasName = name !== undefined && name !== null;
    const hasEmail = email !== undefined && email !== null;

    if (!hasName && !hasEmail) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one field to update (name or email)'
      });
    }

    if (hasName) {
      const trimmed = (name || '').trim();
      if (trimmed.length < 2) {
        return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
      }
      if (trimmed.length > 50) {
        return res.status(400).json({ success: false, message: 'Name cannot exceed 50 characters' });
      }
      user.name = trimmed;
    }

    if (hasEmail) {
      const trimmed = (email || '').trim().toLowerCase();
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!trimmed) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }
      if (!emailRegex.test(trimmed)) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email' });
      }
      const existing = await User.findOne({ email: trimmed }).select('_id').lean();
      if (existing && existing._id.toString() !== user._id.toString()) {
        return res.status(400).json({ success: false, message: 'This email is already in use' });
      }
      user.email = trimmed;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    if (error.code === 11000 || (error.message && error.message.includes('E11000'))) {
      return res.status(400).json({
        success: false,
        message: 'This email is already in use'
      });
    }
    console.error('PUT /api/auth/profile error:', error.message || error);
    if (process.env.NODE_ENV !== 'production') console.error(error.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/auth/password
// @desc    Update current user password. Requires current password.
// @access  Private
// @body    { currentPassword, newPassword }
router.put('/password', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    const { currentPassword, newPassword } = req.body;
    const current = (currentPassword || '').trim();
    const newP = (newPassword || '').trim();

    if (!current) {
      return res.status(400).json({ success: false, message: 'Current password is required' });
    }
    if (!newP) {
      return res.status(400).json({ success: false, message: 'New password is required' });
    }

    const isMatch = await user.comparePassword(current);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const passwordErrors = validatePasswordStrength(newP);
    if (passwordErrors) {
      return res.status(400).json({
        success: false,
        message: `New password must have: ${passwordErrors.join('; ')}`
      });
    }

    user.password = newP;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error('PUT /api/auth/password error:', error.message || error);
    if (process.env.NODE_ENV !== 'production') console.error(error.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
