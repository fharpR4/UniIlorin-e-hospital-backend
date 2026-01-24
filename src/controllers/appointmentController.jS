const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const notificationService = require('../services/notificationService');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, errorResponse, createdResponse, paginatedResponse, updatedResponse, deletedResponse } = require('../utils/responseHandler');
const { paginate, buildPaginationMeta } = require('../utils/helpers');
const AuditLog = require('../models/AuditLog');

// Create new appointment
exports.createAppointment = asyncHandler(async (req, res) => {
  // Add patient ID from authenticated user if role is patient
  if (req.user.role === 'patient') {
    req.body.patient = req.user._id;
  }

  // Check if doctor exists and is available
  const doctor = await Doctor.findById(req.body.doctor);
  if (!doctor) {
    return errorResponse(res, 'Doctor not found', 404);
  }

  // Check if patient exists
  const patient = await Patient.findById(req.body.patient);
  if (!patient) {
    return errorResponse(res, 'Patient not found', 404);
  }

  // Set consultation fee
  req.body.consultationFee = doctor.consultationFee;
  req.body.department = doctor.department;

  // Create appointment
  const appointment = await Appointment.create(req.body);

  // Populate doctor and patient details
  await appointment.populate('doctor patient');

  // Send confirmation notifications
  await notificationService.sendAppointmentConfirmation(
    appointment,
    patient,
    doctor
  );

  // Log appointment creation
  await AuditLog.logActivity({
    user: req.user._id,
    action: 'create',
    resourceType: 'Appointment',
    resourceId: appointment._id,
    description: `Appointment created with Dr. ${doctor.firstName} ${doctor.lastName}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    status: 'success'
  });

  createdResponse(res, appointment, 'Appointment booked successfully');
});

// Get all appointments
exports.getAllAppointments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, doctor, patient, date } = req.query;

  const query = {};

  // Filter based on user role
  if (req.user.role === 'patient') {
    query.patient = req.user._id;
  } else if (req.user.role === 'doctor') {
    query.doctor = req.user._id;
  }

  // Apply additional filters
  if (status) query.status = status;
  if (doctor) query.doctor = doctor;
  if (patient) query.patient = patient;
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    query.appointmentDate = { $gte: startDate, $lt: endDate };
  }

  const { skip, limit: limitNum } = paginate(page, limit);

  const appointments = await Appointment.find(query)
    .populate('patient', 'firstName lastName email phone')
    .populate('doctor', 'firstName lastName specialization')
    .populate('department', 'name')
    .sort({ appointmentDate: 1, appointmentTime: 1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Appointment.countDocuments(query);

  paginatedResponse(
    res,
    appointments,
    buildPaginationMeta(total, page, limitNum),
    'Appointments retrieved successfully'
  );
});

// Get single appointment
exports.getAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('patient', 'firstName lastName email phone bloodGroup genotype')
    .populate('doctor', 'firstName lastName specialization consultationFee')
    .populate('department', 'name location contactInfo')
    .populate('medicalRecord');

  if (!appointment) {
    return errorResponse(res, 'Appointment not found', 404);
  }

  // Check authorization
  if (req.user.role === 'patient' && appointment.patient._id.toString() !== req.user._id.toString()) {
    return errorResponse(res, 'Not authorized to view this appointment', 403);
  }

  if (req.user.role === 'doctor' && appointment.doctor._id.toString() !== req.user._id.toString()) {
    return errorResponse(res, 'Not authorized to view this appointment', 403);
  }

  successResponse(res, appointment, 'Appointment retrieved successfully');
});

// Update appointment
exports.updateAppointment = asyncHandler(async (req, res) => {
  let appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return errorResponse(res, 'Appointment not found', 404);
  }

  // Check authorization
  if (req.user.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
    return errorResponse(res, 'Not authorized to update this appointment', 403);
  }

  if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user._id.toString()) {
    return errorResponse(res, 'Not authorized to update this appointment', 403);
  }

  appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('patient doctor');

  // Log update
  await AuditLog.logActivity({
    user: req.user._id,
    action: 'update',
    resourceType: 'Appointment',
    resourceId: appointment._id,
    description: 'Appointment updated',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    status: 'success'
  });

  updatedResponse(res, appointment, 'Appointment updated successfully');
});

// Cancel appointment
exports.cancelAppointment = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const appointment = await Appointment.findById(req.params.id).populate('patient doctor');

  if (!appointment) {
    return errorResponse(res, 'Appointment not found', 404);
  }

  // Cancel appointment
  await appointment.cancel(req.user._id, reason);

  // Send cancellation notification
  await notificationService.sendAppointmentCancellation(
    appointment,
    appointment.patient,
    appointment.doctor,
    reason
  );

  // Log cancellation
  await AuditLog.logActivity({
    user: req.user._id,
    action: 'cancel',
    resourceType: 'Appointment',
    resourceId: appointment._id,
    description: `Appointment cancelled. Reason: ${reason || 'Not provided'}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    status: 'success'
  });

  updatedResponse(res, appointment, 'Appointment cancelled successfully');
});

// Check in patient
exports.checkIn = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return errorResponse(res, 'Appointment not found', 404);
  }

  if (appointment.status !== 'scheduled' && appointment.status !== 'confirmed') {
    return errorResponse(res, 'Appointment cannot be checked in', 400);
  }

  await appointment.checkIn();

  successResponse(res, appointment, 'Patient checked in successfully');
});

// Start consultation
exports.startConsultation = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return errorResponse(res, 'Appointment not found', 404);
  }

  if (appointment.status !== 'checked-in') {
    return errorResponse(res, 'Patient must be checked in first', 400);
  }

  await appointment.startConsultation();

  successResponse(res, appointment, 'Consultation started');
});

// Complete appointment
exports.completeAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return errorResponse(res, 'Appointment not found', 404);
  }

  if (appointment.status !== 'in-progress') {
    return errorResponse(res, 'Consultation must be in progress', 400);
  }

  await appointment.complete();

  successResponse(res, appointment, 'Appointment completed successfully');
});

// Get today's appointments for doctor
exports.getTodayAppointments = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointments = await Appointment.find({
    doctor: req.user._id,
    appointmentDate: { $gte: today, $lt: tomorrow }
  })
    .populate('patient', 'firstName lastName phone bloodGroup')
    .sort({ appointmentTime: 1 });

  successResponse(res, appointments, 'Today\'s appointments retrieved');
});

// Get upcoming appointments
exports.getUpcomingAppointments = asyncHandler(async (req, res) => {
  const query = {
    appointmentDate: { $gte: new Date() },
    status: { $in: ['scheduled', 'confirmed'] }
  };

  if (req.user.role === 'patient') {
    query.patient = req.user._id;
  } else if (req.user.role === 'doctor') {
    query.doctor = req.user._id;
  }

  const appointments = await Appointment.find(query)
    .populate('patient doctor department')
    .sort({ appointmentDate: 1, appointmentTime: 1 })
    .limit(10);

  successResponse(res, appointments, 'Upcoming appointments retrieved');
});

// Get appointment statistics
exports.getAppointmentStats = asyncHandler(async (req, res) => {
  const query = {};
  
  if (req.user.role === 'doctor') {
    query.doctor = req.user._id;
  } else if (req.user.role === 'patient') {
    query.patient = req.user._id;
  }

  const stats = await Appointment.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const total = await Appointment.countDocuments(query);

  successResponse(res, { stats, total }, 'Statistics retrieved successfully');
});

module.exports = exports;