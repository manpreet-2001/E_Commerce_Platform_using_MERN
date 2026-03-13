/**
 * Socket.io server - attach to HTTP server and broadcast product/order updates
 * so all clients see changes without refresh.
 */

let io = null;

/**
 * Initialize Socket.io and attach to the HTTP server.
 * @param {import('http').Server} httpServer - Node HTTP server (from createServer(app))
 */
function initSocket(httpServer) {
  if (io) return io;
  const { Server } = require('socket.io');
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.replace(/\/$/, '')
        : true,
      methods: ['GET', 'POST'],
    },
  });
  io.on('connection', (socket) => {
    console.log('Socket client connected:', socket.id);
    socket.on('disconnect', () => {
      console.log('Socket client disconnected:', socket.id);
    });
  });
  return io;
}

/**
 * Get the Socket.io server instance. Must call initSocket(server) first.
 * @returns {import('socket.io').Server | null}
 */
function getIO() {
  return io;
}

/**
 * Broadcast to all connected clients that product list data may have changed.
 * Call after create/update/delete product.
 */
function emitProductsUpdated() {
  if (io) io.emit('products:updated');
}

/**
 * Broadcast that a single product changed (for product detail page).
 * @param {string} productId
 */
function emitProductUpdated(productId) {
  if (io && productId) io.emit('product:updated', { productId });
}

/**
 * Broadcast that order list data may have changed.
 * Call after order create, status update, or cancel.
 */
function emitOrdersUpdated() {
  if (io) io.emit('orders:updated');
}

/**
 * Broadcast that a single order changed (for order detail page).
 * @param {string} orderId
 */
function emitOrderUpdated(orderId) {
  if (io && orderId) io.emit('order:updated', { orderId });
}

module.exports = {
  initSocket,
  getIO,
  emitProductsUpdated,
  emitProductUpdated,
  emitOrdersUpdated,
  emitOrderUpdated,
};
