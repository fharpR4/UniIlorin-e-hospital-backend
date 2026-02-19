const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables FIRST before anything else
dotenv.config();

// Import app (the real Express app lives in src/app.js)
const app = require('./src/app');

// ─────────────────────────────────────────────
// DATABASE CONNECTION
// ─────────────────────────────────────────────
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✅ Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// ─────────────────────────────────────────────
// MONGOOSE CONNECTION EVENTS
// ─────────────────────────────────────────────
mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

let server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`🔒 CORS enabled for configured origins`);
  console.log(`🏥 E-Hospital API is live`);
  console.log('='.repeat(50) + '\n');
});

// ─────────────────────────────────────────────
// GRACEFUL SHUTDOWN & ERROR HANDLING
// ─────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  console.error(err.stack);
  server.close(() => {
    console.log('Server closed due to unhandled rejection');
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error(`❌ Uncaught Exception: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = server;