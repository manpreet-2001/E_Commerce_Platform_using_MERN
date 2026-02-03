const jwt = require('jsonwebtoken');

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error('JWT_SECRET is not set. Add it to your .env file (see .env.example).');
  }
  return secret;
};

/**
 * Generate JWT Token
 * @param {string} userId - User's MongoDB _id
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    getSecret(),
    { expiresIn: '7d' }
  );
};

/**
 * Verify JWT Token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token) => {
  return jwt.verify(token, getSecret());
};

/**
 * Decode JWT Token without verification
 * @param {string} token - JWT token to decode
 * @returns {object|null} Decoded token payload or null
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken
};
