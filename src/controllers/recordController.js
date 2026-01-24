const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, errorResponse, createdResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate, buildPaginationMeta } = require('../utils/helpers');
const AuditLog = require('../models/AuditLog');

// Create medical record
exports.createMedicalRecord = asyncHandler(async (req, res) => {
  req.body.doctor = req.user._id;

  const record = await MedicalRecord.create(req.body);
  await record.populate('patient doctor');

  await AuditLog.logActivity({
    user: req.user._id,
    action: 'create',
    resourceType: 'MedicalRecord',
    resourceId: record._id,
    description: 'Medical record created',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    status: 'success'
  });

  createdResponse(res, record, 'Medical record created successfully');
});

// Get all medical records
exports.getAllMedicalRecords = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, patient } = req.query;

  const query = {};
  if (patient) query.patient = patient;

  const { skip, limit: limitNum } = paginate(page, limit);

  const records = await MedicalRecord.find(query)
    .populate('patient doctor appointment')
    .sort({ visitDate: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await MedicalRecord.countDocuments(query);

  paginatedResponse(res, records, buildPaginationMeta(total, page, limitNum), 'Records retrieved');
});

// Get single medical record
exports.getMedicalRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id)
    .populate('patient doctor appointment');

  if (!record) {
    return errorResponse(res, 'Medical record not found', 404);
  }

  // Log access
  await record.logAccess(req.user._id, 'read');

  successResponse(res, record, 'Medical record retrieved');
});

// Update medical record
exports.updateMedicalRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!record) {
    return errorResponse(res, 'Medical record not found', 404);
  }

  successResponse(res, record, 'Medical record updated');
});

module.exports = exports;