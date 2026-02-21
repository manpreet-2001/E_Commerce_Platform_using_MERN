const mongoose = require('mongoose');

const connectDB = async () => {
  // Debug: Check what env vars are available (for troubleshooting)
  const hasMongoUri = !!process.env.MONGODB_URI;
  console.log(`🔍 Environment check: MONGODB_URI is ${hasMongoUri ? 'SET' : 'NOT SET'}`);
  
  // Check if MONGODB_URI is set and not empty
  const mongoUri = process.env.MONGODB_URI?.trim();
  
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not set in environment variables!');
    console.error('   → In Render: Go to your service → Environment → Add MONGODB_URI');
    console.error('   → Key: MONGODB_URI');
    console.error('   → Value: Your MongoDB Atlas connection string (mongodb+srv://...)');
    console.error('   → Get it from: MongoDB Atlas → Connect → Connect your application');
    console.error('   → Make sure there are NO spaces around the = sign');
    console.error('   → Variable name is case-sensitive: MONGODB_URI (all caps)');
    process.exit(1);
  }
  
  // Log that we're using Atlas (without exposing credentials)
  if (mongoUri.includes('mongodb.net')) {
    console.log('📝 Connecting to MongoDB Atlas...');
  } else {
    console.log('📝 Connecting to MongoDB...');
  }
  
  const isAtlas = mongoUri.includes('mongodb.net');

  const options = {
    serverSelectionTimeoutMS: 10000,
    ...(isAtlas && {
      // Atlas over SSL: avoid TLS handshake issues on some Windows/Node setups
      tls: true,
      tlsAllowInvalidCertificates: process.env.NODE_ENV !== 'production',
    }),
  };

  try {
    const conn = await mongoose.connect(mongoUri, options);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    const seedDefaultAdmin = require('../scripts/seedAdmin');
    await seedDefaultAdmin();
  } catch (error) {
    console.error('❌ Database connection error:', error.message || error);
    
    // Check if it's trying to connect to localhost (means MONGODB_URI wasn't read)
    if (error.message && (error.message.includes('127.0.0.1') || error.message.includes('localhost'))) {
      console.error('   → ERROR: Connecting to localhost means MONGODB_URI was not read from environment!');
      console.error('   → In Render: Check Environment Variables section - MONGODB_URI must be set there.');
    }
    
    if (error.message && error.message.includes('whitelist')) {
      console.error('   → Fix: Add Render IPs (or 0.0.0.0/0) in MongoDB Atlas: Network Access → ADD IP ADDRESS.');
    }
    
    if (error.message && (error.message.includes('SSL') || error.message.includes('TLS'))) {
      console.error('   → TLS fix: Update Node.js to LTS (18+). If still failing, try NODE_OPTIONS=--tls-min-v1.2');
    }
    
    if (error.message && error.message.includes('authentication')) {
      console.error('   → Fix: Check MongoDB Atlas username/password in MONGODB_URI.');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;
