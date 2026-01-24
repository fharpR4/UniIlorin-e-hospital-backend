const express = require('express');
const router = express.Router();
const {
  getDashboardOverview,
  getPatientStatistics,
  getAppointmentStatistics,
  getDoctorPerformance,
  getRevenueAnalytics,
  clearCache
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { authorize, isDoctorOrAdmin } = require('../middleware/roleCheck');
const { analyticsLimiter } = require('../middleware/rateLimiter');

// All routes require authentication and doctor/admin role
router.use(protect);
router.use(isDoctorOrAdmin);
router.use(analyticsLimiter);

// Dashboard overview
router.get('/dashboard', getDashboardOverview);

// Detailed statistics
router.get('/patients', getPatientStatistics);
router.get('/appointments', getAppointmentStatistics);
router.get('/doctors', authorize('admin'), getDoctorPerformance);
router.get('/revenue', authorize('admin'), getRevenueAnalytics);

// Cache management (admin only)
router.post('/clear-cache', authorize('admin'), clearCache);

module.exports = router;