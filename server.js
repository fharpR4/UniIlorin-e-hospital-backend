const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://uni-ilorin-e-hospital-frontend.vercel.app',
  'https://unilorin-e-hospital-backend-production.up.railway.app'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        console.log('❌ Blocked origin:', origin);
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// Handle preflight requests
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get('origin') || 'No origin'}`);
  next();
});

// MongoDB Connection
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      console.error('Please set MONGODB_URI in Railway dashboard');
      process.exit(1);
    }
    
    console.log('📡 Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI.replace(/:[^:]*@/, ':****@')); // Hide password in logs
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('Please check your MONGODB_URI in environment variables');
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Import routes - FIXED PATH to point to src/routes
try {
  // Clear the require cache to ensure fresh load
  delete require.cache[require.resolve('./src/routes/authRoutes')];
  
  const authRoutes = require('./src/routes/authRoutes');
  console.log('✅ Auth routes loaded successfully from ./src/routes/authRoutes');
  
  // Use routes
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes registered at /api/auth');
  
} catch (error) {
  console.error('❌ Error loading auth routes:', error.message);
  console.error('Please check that the file exists at: ./src/routes/authRoutes.js');
  console.error('Current directory:', __dirname);
  
  // Create temporary routes for testing
  console.log('⚠️ Using temporary auth endpoints for testing');
  
  app.post('/api/auth/register', (req, res) => {
    console.log('📝 Temporary register endpoint called with:', req.body);
    res.status(201).json({ 
      success: true, 
      message: 'Temporary registration endpoint',
      data: req.body
    });
  });
  
  app.post('/api/auth/login', (req, res) => {
    console.log('🔑 Temporary login endpoint called with:', req.body);
    res.status(200).json({ 
      success: true, 
      message: 'Temporary login endpoint',
      token: 'temporary_jwt_token_for_testing',
      user: {
        _id: '123456789',
        email: req.body.email,
        role: 'patient'
      }
    });
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    mongoState: mongoose.STATES[mongoose.connection.readyState],
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.method} ${req.path} not found` 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`🔑 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`🌐 Allowed CORS origins:`, allowedOrigins);
  console.log(`📁 Current directory: ${__dirname}`);
  console.log(`📁 Routes file: ${__dirname}/src/routes/authRoutes.js`);
  console.log(`\nPress Ctrl+C to stop the server\n`);
});