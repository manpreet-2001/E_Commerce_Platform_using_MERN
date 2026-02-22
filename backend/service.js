/**
 * Central route registration - every route file is registered here
 */

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const uploadRoutes = require('./routes/upload');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');

/**
 * Register all API routes on the Express app
 * @param {import('express').Application} app - Express application instance
 */
function registerRoutes(app) {
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/users', userRoutes);
}

module.exports = registerRoutes;
