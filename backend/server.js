const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/db');

const app = express();

// Middleware
app.use(cors());
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
