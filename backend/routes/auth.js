const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { protect } = require('../middleware/auth');

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

    // Create new user
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
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
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    // Find user (email match is case-insensitive, same as register)
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
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
