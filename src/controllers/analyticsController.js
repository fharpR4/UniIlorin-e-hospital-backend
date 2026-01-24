const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Prescription = require('../models/Prescription');
const AnalyticsCache = require('../models/AnalyticsCache');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/responseHandler');
const { getDateRange } = require('../utils/helpers');

// Get dashboard overview
exports.getDashboardOverview = asyncHandler(async (req, res) => {
  const cacheKey = 'dashboard-overview';
  
  // Check cache first
  const cached = await AnalyticsCache.getByKey(cacheKey);
  if (cached) {
    return successResponse(res, cached.data, 'Dashboard data retrieved from cache');
  }

  // Calculate fresh data
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalPatients,
    totalDoctors,
    todayAppointments,
    totalAppointments,
    activeAppointments,
    completedAppointments
  ] = await Promise.all([
    Patient.countDocuments({ isActive: true }),
    Doctor.countDocuments({ isActive: true }),
    Appointment.countDocuments({
      appointmentDate: { $gte: today, $lt: tomorrow }
    }),
    Appointment.countDocuments(),
    Appointment.countDocuments({
      status: { $in: ['scheduled', 'confirmed', 'checked-in', 'in-progress'] }
    }),
    Appointment.countDocuments({ status: 'completed' })
  ]);

  const data = {
    overview: {
      totalPatients,
      totalDoctors,
      totalAppointments,
      todayAppointments,
      activeAppointments,
      completedAppointments
    },
    lastUpdated: new Date()
  };

  // Cache the result
  await AnalyticsCache.setCache(cacheKey, data, {
    cacheType: 'dashboard-overview',
    ttl: 300 // 5 minutes
  });

  successResponse(res, data, 'Dashboard overview retrieved');
});

// Get patient statistics
exports.getPatientStatistics = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  const { startDate, endDate } = getDateRange(period);

  // Patient registration trends
  const registrationTrends = await Patient.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Blood group distribution
  const bloodGroupDistribution = await Patient.aggregate([
    {
      $group: {
        _id: '$bloodGroup',
        count: { $sum: 1 }
      }
    }
  ]);

  // Age distribution
  const ageDistribution = await Patient.aggregate([
    {
      $bucket: {
        groupBy: '$age',
        boundaries: [0, 18, 30, 45, 60, 100],
        default: 'Unknown',
        output: {
          count: { $sum: 1 }
        }
      }
    }
  ]);

  // Gender distribution
  const genderDistribution = await Patient.aggregate([
    {
      $group: {
        _id: '$gender',
        count: { $sum: 1 }
      }
    }
  ]);

  const data = {
    registrationTrends,
    bloodGroupDistribution,
    ageDistribution,
    genderDistribution,
    period
  };

  successResponse(res, data, 'Patient statistics retrieved');
});

// Get appointment statistics
exports.getAppointmentStatistics = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  const { startDate, endDate } = getDateRange(period);

  // Appointment trends
  const appointmentTrends = await Appointment.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$appointmentDate' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Status distribution
  const statusDistribution = await Appointment.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Type distribution
  const typeDistribution = await Appointment.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ]);

  // Department-wise appointments
  const departmentWise = await Appointment.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $lookup: {
        from: 'departments',
        localField: 'department',
        foreignField: '_id',
        as: 'departmentInfo'
      }
    },
    { $unwind: '$departmentInfo' },
    {
      $group: {
        _id: '$departmentInfo.name',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Peak hours analysis
  const peakHours = await Appointment.aggregate([
    {
      $match: {
        appointmentDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          $substr: ['$appointmentTime', 0, 2]
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const data = {
    appointmentTrends,
    statusDistribution,
    typeDistribution,
    departmentWise,
    peakHours,
    period
  };

  successResponse(res, data, 'Appointment statistics retrieved');
});

// Get doctor performance metrics
exports.getDoctorPerformance = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  const { startDate, endDate } = getDateRange(period);

  // Doctor appointment counts
  const doctorAppointments = await Appointment.aggregate([
    {
      $match: {
        appointmentDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'doctor',
        foreignField: '_id',
        as: 'doctorInfo'
      }
    },
    { $unwind: '$doctorInfo' },
    {
      $group: {
        _id: '$doctor',
        doctorName: { $first: { $concat: ['$doctorInfo.firstName', ' ', '$doctorInfo.lastName'] } },
        totalAppointments: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        noShow: {
          $sum: { $cond: [{ $eq: ['$status', 'no-show'] }, 1, 0] }
        }
      }
    },
    { $sort: { totalAppointments: -1 } },
    { $limit: 10 }
  ]);

  // Average consultation time
  const avgConsultationTime = await Appointment.aggregate([
    {
      $match: {
        status: 'completed',
        consultationStartTime: { $exists: true },
        consultationEndTime: { $exists: true }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'doctor',
        foreignField: '_id',
        as: 'doctorInfo'
      }
    },
    { $unwind: '$doctorInfo' },
    {
      $group: {
        _id: '$doctor',
        doctorName: { $first: { $concat: ['$doctorInfo.firstName', ' ', '$doctorInfo.lastName'] } },
        avgDuration: {
          $avg: {
            $divide: [
              { $subtract: ['$consultationEndTime', '$consultationStartTime'] },
              60000 // Convert to minutes
            ]
          }
        }
      }
    },
    { $sort: { avgDuration: 1 } }
  ]);

  // Doctor ratings
  const doctorRatings = await Doctor.find()
    .select('firstName lastName rating specialization')
    .sort({ 'rating.average': -1 })
    .limit(10);

  const data = {
    doctorAppointments,
    avgConsultationTime,
    doctorRatings,
    period
  };

  successResponse(res, data, 'Doctor performance metrics retrieved');
});

// Get revenue analytics
exports.getRevenueAnalytics = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  const { startDate, endDate } = getDateRange(period);

  // Revenue trends
  const revenueTrends = await Appointment.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        isPaid: true
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        totalRevenue: { $sum: '$consultationFee' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Payment method distribution
  const paymentMethods = await Appointment.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        isPaid: true
      }
    },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$consultationFee' }
      }
    }
  ]);

  // Department-wise revenue
  const departmentRevenue = await Appointment.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        isPaid: true
      }
    },
    {
      $lookup: {
        from: 'departments',
        localField: 'department',
        foreignField: '_id',
        as: 'departmentInfo'
      }
    },
    { $unwind: '$departmentInfo' },
    {
      $group: {
        _id: '$departmentInfo.name',
        totalRevenue: { $sum: '$consultationFee' },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  const totalRevenue = await Appointment.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        isPaid: true
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$consultationFee' }
      }
    }
  ]);

  const data = {
    revenueTrends,
    paymentMethods,
    departmentRevenue,
    totalRevenue: totalRevenue[0]?.total || 0,
    period
  };

  successResponse(res, data, 'Revenue analytics retrieved');
});

// Clear analytics cache
exports.clearCache = asyncHandler(async (req, res) => {
  const { cacheType } = req.body;

  if (cacheType) {
    await AnalyticsCache.invalidateByType(cacheType);
  } else {
    await AnalyticsCache.deleteMany({});
  }

  successResponse(res, null, 'Cache cleared successfully');
});

module.exports = exports;