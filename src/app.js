const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

// Initialize app FIRST
const app = express();

// Trust proxy IMMEDIATELY (critical for Railway)
app.set('trust proxy', 1);

// ===================================================================
// CORS MIDDLEWARE - MUST BE ABSOLUTELY FIRST BEFORE ANYTHING ELSE
// ===================================================================
app.use((req, res, next) => {
  // Get the origin from request
  const origin = req.headers.origin;
  
  // Log for debugging
  console.log(`Request from origin: ${origin}`);
  console.log(`Request method: ${req.method}`);
  console.log(`Request path: ${req.path}`);
  
  // Always set these headers for ALL requests
  res.setHeader('Access-Control-Allow-Origin', origin || 'https://uni-ilorin-e-hospital-frontend.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('Preflight request - returning 200');
    return res.status(200).end();
  }
  
  next();
});

// Now load other middleware AFTER CORS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check - BEFORE routes
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'E-Hospital API is running',
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  });
});

// Test CORS endpoint
app.get('/api/cors-test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CORS is working!',
    receivedOrigin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Import routes - AFTER basic setup
let authRoutes, patientRoutes, doctorRoutes, appointmentRoutes;
let recordRoutes, prescriptionRoutes, notificationRoutes;
let analyticsRoutes, adminRoutes, errorHandler;

try {
  authRoutes = require('./routes/authRoutes');
  patientRoutes = require('./routes/patientRoutes');
  doctorRoutes = require('./routes/doctorRoutes');
  appointmentRoutes = require('./routes/appointmentRoutes');
  recordRoutes = require('./routes/recordRoutes');
  prescriptionRoutes = require('./routes/prescriptionRoutes');
  notificationRoutes = require('./routes/notificationRoutes');
  analyticsRoutes = require('./routes/analyticsRoutes');
  adminRoutes = require('./routes/adminRoutes');
  const errorModule = require('./middleware/errorHandler');
  errorHandler = errorModule.errorHandler;
} catch (error) {
  console.error('Error loading routes:', error.message);
  // Continue anyway - routes might not exist yet
}

// API routes - only if they loaded successfully
if (authRoutes) app.use('/api/auth', authRoutes);
if (patientRoutes) app.use('/api/patients', patientRoutes);
if (doctorRoutes) app.use('/api/doctors', doctorRoutes);
if (appointmentRoutes) app.use('/api/appointments', appointmentRoutes);
if (recordRoutes) app.use('/api/records', recordRoutes);
if (prescriptionRoutes) app.use('/api/prescriptions', prescriptionRoutes);
if (notificationRoutes) app.use('/api/notifications', notificationRoutes);
if (analyticsRoutes) app.use('/api/analytics', analyticsRoutes);
if (adminRoutes) app.use('/api/admin', adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Error handler - only if it loaded
if (errorHandler) {
  app.use(errorHandler);
} else {
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal Server Error'
    });
  });
}

// Log that app is ready
console.log('App.js loaded successfully');
console.log('CORS enabled for all origins');

module.exports = app;
