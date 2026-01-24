const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const notificationService = require('../services/notificationService');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, errorResponse, createdResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate, buildPaginationMeta } = require('../utils/helpers');

// Create prescription
exports.createPrescription = asyncHandler(async (req, res) => {
  req.body.doctor = req.user._id;

  const prescription = await Prescription.create(req.body);
  await prescription.populate('patient doctor');

  createdResponse(res, prescription, 'Prescription created successfully');
});

// Get all prescriptions
exports.getAllPrescriptions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, patient, status } = req.query;

  const query = {};
  if (patient) query.patient = patient;
  if (status) query.status = status;

  const { skip, limit: limitNum } = paginate(page, limit);

  const prescriptions = await Prescription.find(query)
    .populate('patient doctor')
    .sort({ prescriptionDate: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Prescription.countDocuments(query);

  paginatedResponse(res, prescriptions, buildPaginationMeta(total, page, limitNum), 'Prescriptions retrieved');
});

// Get single prescription
exports.getPrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate('patient doctor medicalRecord');

  if (!prescription) {
    return errorResponse(res, 'Prescription not found', 404);
  }

  successResponse(res, prescription, 'Prescription retrieved');
});

// Update prescription
exports.updatePrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!prescription) {
    return errorResponse(res, 'Prescription not found', 404);
  }

  successResponse(res, prescription, 'Prescription updated');
});

// Dispense prescription
exports.dispensePrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    return errorResponse(res, 'Prescription not found', 404);
  }

  await prescription.dispense(req.body);

  successResponse(res, prescription, 'Prescription dispensed successfully');
});

module.exports = exports;