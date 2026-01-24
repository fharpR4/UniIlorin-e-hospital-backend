const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getAllAppointments,
  getAppointment,
  updateAppointment,
  cancelAppointment,
  checkIn,
  startConsultation,
  completeAppointment,
  getTodayAppointments,
  getUpcomingAppointments,
  getAppointmentStats
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');
const { authorize, canManageAppointment } = require('../middleware/roleCheck');
const { validate, appointmentSchema } = require('../middleware/validator');
const { appointmentLimiter } = require('../middleware/rateLimiter');

// All routes require authentication
router.use(protect);

// Statistics route
router.get('/stats', getAppointmentStats);

// Today's appointments (for doctors)
router.get('/today', authorize('doctor', 'admin'), getTodayAppointments);

// Upcoming appointments
router.get('/upcoming', getUpcomingAppointments);

// Main CRUD routes
router
  .route('/')
  .get(getAllAppointments)
  .post(appointmentLimiter, validate(appointmentSchema), createAppointment);

router
  .route('/:id')
  .get(getAppointment)
  .put(canManageAppointment, updateAppointment);

// Action routes
router.put('/:id/cancel', canManageAppointment, cancelAppointment);
router.put('/:id/check-in', authorize('doctor', 'admin'), checkIn);
router.put('/:id/start-consultation', authorize('doctor'), startConsultation);
router.put('/:id/complete', authorize('doctor'), completeAppointment);

module.exports = router;