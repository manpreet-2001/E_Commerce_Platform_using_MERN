const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { protect } = require('../middleware/auth');

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

module.exports = router;
