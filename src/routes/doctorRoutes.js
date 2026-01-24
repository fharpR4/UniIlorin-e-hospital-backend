const express = require('express');
const router = express.Router();
const {
  getAllDoctors,
  getDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorDashboard,
  getDoctorSchedule,
  updateDoctorSchedule,
  getAvailableSlots,
  getDoctorPatients,
  getDoctorStatistics
} = require('../controllers/doctorController');
const { protect } = require('../middleware/auth');
const { authorize, isDoctor } = require('../middleware/roleCheck');
const { searchLimiter } = require('../middleware/rateLimiter');

// All routes require authentication
router.use(protect);

// Doctor dashboard (for logged in doctor)
router.get('/dashboard', authorize('doctor'), getDoctorDashboard);

// Doctor's patients
router.get('/my-patients', authorize('doctor'), getDoctorPatients);

// Schedule management
router.get('/my-schedule', authorize('doctor'), getDoctorSchedule);
router.put('/my-schedule', authorize('doctor'), updateDoctorSchedule);

// Statistics (admin only)
router.get('/statistics', authorize('admin'), getDoctorStatistics);

// Public doctor list (with search)
router.get('/', searchLimiter, getAllDoctors);

// Get available slots for specific doctor and date
router.get('/:id/available-slots', getAvailableSlots);

// Get doctor schedule
router.get('/:id/schedule', getDoctorSchedule);

// Single doctor operations
router
  .route('/:id')
  .get(getDoctor)
  .put(authorize('admin', 'doctor'), updateDoctor)
  .delete(authorize('admin'), deleteDoctor);

module.exports = router;