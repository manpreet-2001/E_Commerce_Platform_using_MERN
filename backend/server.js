const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/db');

// Warn if JWT_SECRET is missing (registration/login will fail without it)
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
  console.warn('⚠️  JWT_SECRET is not set in .env. Auth (register/login) will fail. Copy .env.example to .env and set JWT_SECRET.');
}

const app = express();

// Middleware – allow frontend origin in production (set FRONTEND_URL when you deploy)
const corsOptions = {
  origin: process.env.FRONTEND_URL || true,
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Register all routes from service.js (each route in its own file)
const registerRoutes = require('./service');
registerRoutes(app);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'CityTech Store API',
    version: '1.0.0',
    status: 'running'
  });
});

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
