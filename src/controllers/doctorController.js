const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, errorResponse, paginatedResponse, updatedResponse } = require('../utils/responseHandler');
const { paginate, buildPaginationMeta, getDayName } = require('../utils/helpers');
const AuditLog = require('../models/AuditLog');

// Get all doctors
exports.getAllDoctors = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, specialization, department, availableToday } = req.query;

  const query = { isActive: true };

  // Search by name or specialization
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { specialization: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } }
    ];
  }

  if (specialization) query.specialization = specialization;
  if (department) query.department = department;

  // Filter by availability today
  if (availableToday === 'true') {
    const today = getDayName(new Date());
    query[`availability.${today}.available`] = true;
  }

  const { skip, limit: limitNum } = paginate(page, limit);

  const doctors = await Doctor.find(query)
    .populate('department', 'name location contactInfo')
    .select('-password')
    .sort({ rating: -1, firstName: 1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Doctor.countDocuments(query);

  paginatedResponse(
    res,
    doctors,
    buildPaginationMeta(total, page, limitNum),
    'Doctors retrieved successfully'
  );
});

// Get single doctor
exports.getDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id)
    .populate('department', 'name location contactInfo operatingHours')
    .select('-password');

  if (!doctor) {
    return errorResponse(res, 'Doctor not found', 404);
  }

  successResponse(res, doctor, 'Doctor retrieved successfully');
});

// Update doctor
exports.updateDoctor = asyncHandler(async (req, res) => {
  // Don't allow updating sensitive fields
  delete req.body.password;
  delete req.body.email;
  delete req.body.role;
  delete req.body.employeeId;
  delete req.body.licenseNumber;

  const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('-password');

  if (!doctor) {
    return errorResponse(res, 'Doctor not found', 404);
  }

  // Log update
  await AuditLog.logActivity({
    user: req.user._id,
    action: 'update',
    resourceType: 'Doctor',
    resourceId: doctor._id,
    description: 'Doctor profile updated',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    status: 'success'
  });

  updatedResponse(res, doctor, 'Doctor updated successfully');
});

// Delete doctor (soft delete - deactivate)
exports.deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    return errorResponse(res, 'Doctor not found', 404);
  }

  doctor.isActive = false;
  await doctor.save();

  // Log deletion
  await AuditLog.logActivity({
    user: req.user._id,
    action: 'delete',
    resourceType: 'Doctor',
    resourceId: doctor._id,
    description: 'Doctor account deactivated',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    status: 'success'
  });

  successResponse(res, null, 'Doctor deactivated successfully');
});

// Get doctor dashboard
exports.getDoctorDashboard = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;

  // Today's appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAppointments = await Appointment.find({
    doctor: doctorId,
    appointmentDate: { $gte: today, $lt: tomorrow }
  })
    .populate('patient', 'firstName lastName phone bloodGroup')
    .sort({ appointmentTime: 1 });

  // Upcoming appointments (next 7 days)
  const next7Days = new Date(today);
  next7Days.setDate(next7Days.getDate() + 7);

  const upcomingAppointments = await Appointment.find({
    doctor: doctorId,
    appointmentDate: { $gte: tomorrow, $lt: next7Days },
    status: { $in: ['scheduled', 'confirmed'] }
  })
    .populate('patient', 'firstName lastName')
    .sort({ appointmentDate: 1, appointmentTime: 1 })
    .limit(10);

  // Patient queue (checked in but not started)
  const patientQueue = await Appointment.find({
    doctor: doctorId,
    status: 'checked-in'
  })
    .populate('patient', 'firstName lastName')
    .sort({ checkInTime: 1 });

  // Statistics
  const totalPatients = await Patient.countDocuments({ assignedDoctor: doctorId });
  const totalAppointments = await Appointment.countDocuments({ doctor: doctorId });
  const completedToday = await Appointment.countDocuments({
    doctor: doctorId,
    appointmentDate: { $gte: today, $lt: tomorrow },
    status: 'completed'
  });

  const dashboardData = {
    todayAppointments,
    upcomingAppointments,
    patientQueue,
    statistics: {
      totalPatients,
      totalAppointments,
      todayTotal: todayAppointments.length,
      completedToday,
      pending: todayAppointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length
    }
  };

  successResponse(res, dashboardData, 'Dashboard data retrieved successfully');
});

// Get doctor's schedule
exports.getDoctorSchedule = asyncHandler(async (req, res) => {
  const doctorId = req.params.id || req.user._id;

  const doctor = await Doctor.findById(doctorId).select('availability slotDuration');

  if (!doctor) {
    return errorResponse(res, 'Doctor not found', 404);
  }

  successResponse(res, doctor, 'Schedule retrieved successfully');
});

// Update doctor's schedule
exports.updateDoctorSchedule = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const { availability, slotDuration } = req.body;

  const doctor = await Doctor.findByIdAndUpdate(
    doctorId,
    { availability, slotDuration },
    { new: true, runValidators: true }
  );

  updatedResponse(res, doctor, 'Schedule updated successfully');
});

// Get available slots for a specific date
exports.getAvailableSlots = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const doctorId = req.params.id;

  const doctor = await Doctor.findById(doctorId);

  if (!doctor) {
    return errorResponse(res, 'Doctor not found', 404);
  }

  const dayName = getDayName(new Date(date));
  const allSlots = doctor.getAvailableSlots(dayName);

  // Get booked appointments for this date
  const appointmentDate = new Date(date);
  const bookedAppointments = await Appointment.find({
    doctor: doctorId,
    appointmentDate: appointmentDate,
    status: { $nin: ['cancelled', 'no-show'] }
  }).select('appointmentTime');

  const bookedTimes = bookedAppointments.map(apt => apt.appointmentTime);

  // Filter out booked slots
  const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

  successResponse(res, { date, dayName, availableSlots, bookedSlots: bookedTimes }, 'Available slots retrieved');
});

// Get doctor's patients
exports.getDoctorPatients = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const doctorId = req.user._id;

  const { skip, limit: limitNum } = paginate(page, limit);

  const patients = await Patient.find({ assignedDoctor: doctorId })
    .select('-password')
    .sort({ firstName: 1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Patient.countDocuments({ assignedDoctor: doctorId });

  paginatedResponse(
    res,
    patients,
    buildPaginationMeta(total, page, limitNum),
    'Patients retrieved successfully'
  );
});

// Get doctor statistics
exports.getDoctorStatistics = asyncHandler(async (req, res) => {
  const stats = await Doctor.aggregate([
    {
      $group: {
        _id: '$specialization',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating.average' },
        totalPatients: { $sum: '$totalPatients' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const totalDoctors = await Doctor.countDocuments({ isActive: true });

  successResponse(res, { stats, totalDoctors }, 'Statistics retrieved');
});

module.exports = exports;