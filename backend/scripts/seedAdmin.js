/**
 * Ensures a default admin user exists.
 * Uses ADMIN_EMAIL and ADMIN_PASSWORD from env, or defaults for development.
 * Safe to run on every app start: only creates if no admin user exists.
 */
const User = require('../models/User');

const DEFAULT_ADMIN_EMAIL = 'admin@citytech.com';
const DEFAULT_ADMIN_PASSWORD = 'Admin123!';
const DEFAULT_ADMIN_NAME = 'Admin';

async function seedDefaultAdmin() {
  try {
    const email = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
    const name = (process.env.ADMIN_NAME || DEFAULT_ADMIN_NAME).trim();

    const existingAdmin = await User.findOne({ role: 'admin' }).select('email').lean();
    if (existingAdmin) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('ℹ️  Admin user already exists:', existingAdmin.email);
      }
      return;
    }

    const admin = await User.create({
      name,
      email,
      password,
      role: 'admin'
    });

    console.log('✅ Default admin user created.');
    console.log('   Email:', admin.email);
    console.log('   Login with the credentials above (change password after first login in production).');
  } catch (err) {
    console.error('❌ seedDefaultAdmin error:', err.message || err);
    if (err.code === 11000) {
      console.log('   (Admin or same email may already exist; safe to ignore.)');
    }
  }
}

module.exports = seedDefaultAdmin;
