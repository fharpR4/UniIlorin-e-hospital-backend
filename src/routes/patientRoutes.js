const express = require('express');
const router = express.Router();
const {
  getAllPatients,
  getPatient,
  updatePatient,
  deletePatient,
  getPatientDashboard,
  getPatientMedicalHistory,
  getPatientPrescriptions,
  assignDoctor,
  getPatientStatistics,
  getCurrentPatient,
  getCurrentPatientMedicalHistory,
  getCurrentPatientPrescriptions
} = require('../controllers/patientController');
const { protect } = require('../middleware/auth');
const { authorize, isDoctorOrAdmin, canAccessPatientData } = require('../middleware/roleCheck');
const { searchLimiter } = require('../middleware/rateLimiter');

// All routes require authentication
router.use(protect);

// ========== DEBUG ROUTE ==========
router.get('/debug-auth', (req, res) => {
  res.json({
    success: true,
    user: req.user ? {
      id: req.user._id,
      role: req.user.role,
      email: req.user.email,
      isActive: req.user.isActive,
      isEmailVerified: req.user.isEmailVerified
    } : null,
    timestamp: new Date().toISOString()
  });
});

// ========== CURRENT PATIENT ROUTES (no ID needed) ==========
// These use the logged-in patient's ID from req.user._id
router.get('/profile', authorize('patient'), getCurrentPatient);
router.get('/medical-records', authorize('patient'), getCurrentPatientMedicalHistory);
router.get('/prescriptions', authorize('patient'), getCurrentPatientPrescriptions);
router.get('/dashboard', authorize('patient'), getPatientDashboard);

// Statistics (admin only)
router.get('/statistics', authorize('admin'), getPatientStatistics);

// Patient list and search (doctors and admins only)
router.get('/', isDoctorOrAdmin, searchLimiter, getAllPatients);

// ========== SPECIFIC PATIENT ROUTES (by ID) ==========
// These require patient ID parameter and permission checks
router
  .route('/:id')
  .get(canAccessPatientData, getPatient)
  .put(canAccessPatientData, updatePatient)
  .delete(authorize('admin'), deletePatient);

router.get('/:id/medical-history', canAccessPatientData, getPatientMedicalHistory);
router.get('/:id/prescriptions', canAccessPatientData, getPatientPrescriptions);
router.put('/:id/assign-doctor', authorize('admin'), assignDoctor);

module.exports = router;