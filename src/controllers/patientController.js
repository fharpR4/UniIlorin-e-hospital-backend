const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Prescription = require('../models/Prescription');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// Get all patients (admin/doctor only)
exports.getAllPatients = asyncHandler(async (req, res) => {
  const patients = await Patient.find({ role: 'patient' })
    .select('-password')
    .populate({
      path: 'assignedDoctor',
      select: 'firstName lastName specialization'
    })
    .sort({ createdAt: -1 });

  successResponse(res, patients, 'Patients retrieved successfully');
});

// Get single patient by ID
exports.getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id)
    .select('-password')
    .populate({
      path: 'assignedDoctor',
      select: 'firstName lastName specialization department'
    });

  if (!patient) {
    return errorResponse(res, 'Patient not found', 404);
  }

  successResponse(res, patient, 'Patient retrieved successfully');
});

// Get current patient profile (logged in patient)
exports.getCurrentPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.user._id)
    .select('-password')
    .populate({
      path: 'assignedDoctor',
      select: 'firstName lastName specialization department'
    });

  if (!patient) {
    return errorResponse(res, 'Patient not found', 404);
  }

  successResponse(res, patient, 'Patient profile retrieved successfully');
});

// Update patient
exports.updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('-password');

  if (!patient) {
    return errorResponse(res, 'Patient not found', 404);
  }

  successResponse(res, patient, 'Patient updated successfully');
});

// Delete patient (admin only)
exports.deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    return errorResponse(res, 'Patient not found', 404);
  }

  await patient.deleteOne();
  successResponse(res, null, 'Patient deleted successfully');
});

// Get patient dashboard
exports.getPatientDashboard = asyncHandler(async (req, res) => {
  const patientId = req.user.role === 'patient' ? req.user._id : req.params.id;
  
  const patient = await Patient.findById(patientId)
    .select('-password')
    .populate({
      path: 'assignedDoctor',
      select: 'firstName lastName specialization'
    });

  if (!patient) {
    return errorResponse(res, 'Patient not found', 404);
  }

  // Get upcoming appointments
  const Appointment = require('../models/Appointment');
  const appointments = await Appointment.find({
    patient: patientId,
    status: { $in: ['pending', 'confirmed'] }
  })
    .populate({
      path: 'doctor',
      select: 'firstName lastName specialization'
    })
    .sort({ date: 1 })
    .limit(5);

  // Get prescriptions (using YOUR Prescription model structure)
  const prescriptions = await Prescription.find({
    patient: patientId
  })
    .populate({
      path: 'doctor',
      select: 'firstName lastName'
    })
    .sort({ createdAt: -1 })
    .limit(5);

  const dashboardData = {
    patient,
    upcomingAppointments: appointments,
    prescriptions: prescriptions,
    stats: {
      totalAppointments: await Appointment.countDocuments({ patient: patientId }),
      completedAppointments: await Appointment.countDocuments({ patient: patientId, status: 'completed' }),
      totalPrescriptions: await Prescription.countDocuments({ patient: patientId })
    }
  };

  successResponse(res, dashboardData, 'Dashboard data retrieved successfully');
});

// Get patient medical history
exports.getPatientMedicalHistory = asyncHandler(async (req, res) => {
  const patientId = req.params.id;
  
  const patient = await Patient.findById(patientId)
    .select('medicalHistory bloodGroup genotype allergies currentMedications');

  if (!patient) {
    return errorResponse(res, 'Patient not found', 404);
  }

  const medicalRecords = patient.medicalHistory || [];

  successResponse(res, medicalRecords, 'Medical history retrieved successfully');
});

// Get current patient's medical history (logged in patient)
exports.getCurrentPatientMedicalHistory = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.user._id)
    .select('medicalHistory bloodGroup genotype allergies currentMedications');

  if (!patient) {
    return errorResponse(res, 'Patient not found', 404);
  }

  const medicalRecords = patient.medicalHistory || [];

  successResponse(res, medicalRecords, 'Medical history retrieved successfully');
});

// Get patient prescriptions
exports.getPatientPrescriptions = asyncHandler(async (req, res) => {
  const patientId = req.params.id;
  
  const prescriptions = await Prescription.find({ patient: patientId })
    .populate({
      path: 'doctor',
      select: 'firstName lastName specialization'
    })
    .sort({ createdAt: -1 });

  successResponse(res, prescriptions, 'Prescriptions retrieved successfully');
});

// Get current patient's prescriptions (logged in patient)
exports.getCurrentPatientPrescriptions = asyncHandler(async (req, res) => {
  const prescriptions = await Prescription.find({ patient: req.user._id })
    .populate({
      path: 'doctor',
      select: 'firstName lastName specialization'
    })
    .sort({ createdAt: -1 });

  successResponse(res, prescriptions, 'Prescriptions retrieved successfully');
});

// Assign doctor to patient (admin only)
exports.assignDoctor = asyncHandler(async (req, res) => {
  const { doctorId } = req.body;
  
  if (!doctorId) {
    return errorResponse(res, 'Doctor ID is required', 400);
  }

  const patient = await Patient.findById(req.params.id);
  const doctor = await Doctor.findById(doctorId);

  if (!patient) {
    return errorResponse(res, 'Patient not found', 404);
  }

  if (!doctor) {
    return errorResponse(res, 'Doctor not found', 404);
  }

  patient.assignedDoctor = doctorId;
  await patient.save();

  successResponse(res, patient, 'Doctor assigned successfully');
});

// Get patient statistics (admin only)
exports.getPatientStatistics = asyncHandler(async (req, res) => {
  const totalPatients = await Patient.countDocuments({ role: 'patient' });
  const activePatients = await Patient.countDocuments({ role: 'patient', isActive: true });
  const newPatients = await Patient.countDocuments({
    role: 'patient',
    createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) }
  });

  const stats = {
    totalPatients,
    activePatients,
    newPatients,
    inactivePatients: totalPatients - activePatients
  };

  successResponse(res, stats, 'Statistics retrieved successfully');
});