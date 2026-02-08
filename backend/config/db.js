const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/citytechstore');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error.message || error);
    if (error.message && error.message.includes('whitelist')) {
      console.error('   → Fix: Add your current IP in MongoDB Atlas: Network Access → ADD IP ADDRESS. See backend/MONGODB_ATLAS_FIX.md');
    }
    process.exit(1);
  }
};

module.exports = connectDB;
