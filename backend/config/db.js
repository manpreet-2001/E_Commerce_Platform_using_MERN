const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/citytechstore';
  const isAtlas = uri.includes('mongodb.net');

  const options = {
    serverSelectionTimeoutMS: 10000,
    ...(isAtlas && {
      // Atlas over SSL: avoid TLS handshake issues on some Windows/Node setups
      tls: true,
      tlsAllowInvalidCertificates: process.env.NODE_ENV !== 'production',
    }),
  };

  try {
    const conn = await mongoose.connect(uri, options);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error.message || error);
    if (error.message && error.message.includes('whitelist')) {
      console.error('   → Fix: Add your current IP in MongoDB Atlas: Network Access → ADD IP ADDRESS.');
    }
    if (error.message && error.message.includes('SSL') || (error.message && error.message.includes('TLS'))) {
      console.error('   → TLS fix: Update Node.js to LTS (18+). If still failing, try NODE_OPTIONS=--tls-min-v1.2');
    }
    process.exit(1);
  }
};

module.exports = connectDB;
