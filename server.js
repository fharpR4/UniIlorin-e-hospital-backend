const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();

// 🔓 TEMPORARY: Allow all CORS for debugging
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

// Handle preflight requests
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Log all requests with detailed info
app.use((req, res, next) => {
  console.log('\n=== INCOMING REQUEST ===');
  console.log('Time:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Origin:', req.get('origin') || 'No origin');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  console.log('========================\n');
  next();
});

// Add CORS headers manually as backup
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.get('origin') || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
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

// Import routes
try {
  // Try multiple possible paths
  const possiblePaths = [
    './src/routes/authRoutes',
    './src/routes/authRoutes.js',
    './routes/authRoutes',
    './routes/authRoutes.js'
  ];
  
  let authRoutes = null;
  let loadedPath = null;
  
  for (const routePath of possiblePaths) {
    try {
      delete require.cache[require.resolve(routePath)];
      authRoutes = require(routePath);
      loadedPath = routePath;
      console.log(`✅ Auth routes loaded successfully from ${loadedPath}`);
      break;
    } catch (err) {
      // Continue to next path
    }
  }
  
  if (authRoutes && loadedPath) {
    app.use('/api/auth', authRoutes);
    console.log('✅ Auth routes registered at /api/auth');
  } else {
    throw new Error('Could not find auth routes file');
  }
  
} catch (error) {
  console.error('❌ Error loading auth routes:', error.message);
  console.error('Current directory:', __dirname);
  
  // Create temporary routes for testing
  console.log('⚠️ Using temporary auth endpoints for testing');
  
  // Temporary register endpoint
  app.post('/api/auth/register', (req, res) => {
    console.log('📝 Temporary register endpoint called');
    res.status(201).json({ 
      success: true, 
      message: 'Temporary registration endpoint',
      token: 'temp_jwt_token_' + Date.now(),
      user: {
        _id: 'temp_' + Date.now(),
        email: req.body.email,
        firstName: req.body.firstName || 'Test',
        lastName: req.body.lastName || 'User',
        role: req.body.role || 'patient'
      }
    });
  });
  
  // Temporary login endpoint
  app.post('/api/auth/login', (req, res) => {
    console.log('🔑 Temporary login endpoint called');
    const { email, password } = req.body;
    
    // Simple validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Temporary login successful',
      token: 'temp_jwt_token_' + Date.now(),
      user: {
        _id: 'temp_' + Date.now(),
        email: email,
        firstName: 'Test',
        lastName: 'User',
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
    environment: process.env.NODE_ENV || 'development',
    cors: 'disabled for debugging'
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
  console.error('Stack:', err.stack);
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
  console.log('\n' + '='.repeat(50));
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log('📍 Health check: http://localhost:' + PORT + '/health');
  console.log('🧪 Test endpoint: http://localhost:' + PORT + '/test');
  console.log('🔑 Auth endpoints: http://localhost:' + PORT + '/api/auth/*');
  console.log('🔓 CORS: DISABLED - All origins allowed');
  console.log('📁 Current directory:', __dirname);
  console.log('='.repeat(50) + '\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('❌ UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  console.log(err.stack);
  process.exit(1);
});