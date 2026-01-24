const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Admin = require('../models/Admin');
const Department = require('../models/Department');
const AuditLog = require('../models/AuditLog');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, errorResponse, createdResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate, buildPaginationMeta } = require('../utils/helpers');

// Get all users
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, search } = req.query;

  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const { skip, limit: limitNum } = paginate(page, limit);

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await User.countDocuments(query);

  paginatedResponse(res, users, buildPaginationMeta(total, page, limitNum), 'Users retrieved');
});

// Toggle user active status
exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  user.isActive = !user.isActive;
  await user.save();

  await AuditLog.logActivity({
    user: req.user._id,
    action: 'update',
    resourceType: 'User',
    resourceId: user._id,
    description: `User ${user.isActive ? 'activated' : 'deactivated'}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    status: 'success'
  });

  successResponse(res, user, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`);
});

// Get system statistics
exports.getSystemStatistics = asyncHandler(async (req, res) => {
  const [totalUsers, totalPatients, totalDoctors, totalAdmins] = await Promise.all([
    User.countDocuments({ isActive: true }),
    Patient.countDocuments({ isActive: true }),
    Doctor.countDocuments({ isActive: true }),
    Admin.countDocuments({ isActive: true })
  ]);

  const stats = {
    totalUsers,
    totalPatients,
    totalDoctors,
    totalAdmins
  };

  successResponse(res, stats, 'System statistics retrieved');
});

// Get audit logs
exports.getAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, action, userId, startDate, endDate } = req.query;

  const logs = await AuditLog.getUserActivity(userId, {
    limit,
    skip: (page - 1) * limit,
    action,
    startDate,
    endDate
  });

  successResponse(res, logs, 'Audit logs retrieved');
});

module.exports = exports;