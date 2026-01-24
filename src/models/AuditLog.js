const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false  // ✅ CHANGED TO FALSE - allows null for failed login attempts
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: [
        'login',
        'logout',
        'register',
        'password-reset',
        'profile-update',
        'create',
        'read',
        'update',
        'delete',
        'export',
        'import',
        'download',
        'upload',
        'approve',
        'reject',
        'cancel',
        'restore',
        'archive',
        'send-notification',
        'access-denied',
        'permission-change',
        'system-config-change'
      ]
    },
    resourceType: {
      type: String,
      required: true,
      enum: [
        'User',
        'Patient',
        'Doctor',
        'Admin',
        'Appointment',
        'MedicalRecord',
        'Prescription',
        'Department',
        'Notification',
        'System',
        'Report',
        'Settings'
      ]
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId
    },
    resourceName: String,
    description: {
      type: String,
      required: true
    },
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed
    },
    status: {
      type: String,
      enum: ['success', 'failure', 'pending'],
      default: 'success'
    },
    ipAddress: {
      type: String,
      required: true
    },
    userAgent: String,
    deviceInfo: {
      browser: String,
      os: String,
      device: String
    },
    location: {
      country: String,
      city: String,
      region: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    },
    endpoint: String,
    requestData: mongoose.Schema.Types.Mixed,
    responseCode: Number,
    errorMessage: String,
    duration: Number,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    category: {
      type: String,
      enum: [
        'authentication',
        'authorization',
        'data-modification',
        'data-access',
        'system-administration',
        'patient-care',
        'billing',
        'reporting',
        'security',
        'compliance'
      ],
      default: 'data-access'
    },
    tags: [String],
    metadata: mongoose.Schema.Types.Mixed,
    isReviewed: {
      type: Boolean,
      default: false
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reviewNotes: String,
    isSuspicious: {
      type: Boolean,
      default: false
    },
    suspiciousReason: String,
    relatedLogs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AuditLog'
      }
    ],
    sessionId: String,
    transactionId: String
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for efficient querying
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ ipAddress: 1 });
auditLogSchema.index({ status: 1 });
auditLogSchema.index({ severity: 1 });
auditLogSchema.index({ category: 1 });
auditLogSchema.index({ isSuspicious: 1 });
auditLogSchema.index({ sessionId: 1 });

// TTL index - delete logs older than 1 year
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

// Virtual for formatted timestamp
auditLogSchema.virtual('formattedTimestamp').get(function () {
  return this.createdAt.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium'
  });
});

// Virtual to check if log is recent (within last 24 hours)
auditLogSchema.virtual('isRecent').get(function () {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.createdAt > oneDayAgo;
});

// Method to mark as reviewed
auditLogSchema.methods.markAsReviewed = function (reviewerId, notes) {
  this.isReviewed = true;
  this.reviewedBy = reviewerId;
  this.reviewedAt = Date.now();
  this.reviewNotes = notes;
  return this.save();
};

// Method to mark as suspicious
auditLogSchema.methods.markAsSuspicious = function (reason) {
  this.isSuspicious = true;
  this.suspiciousReason = reason;
  this.severity = 'critical';
  return this.save();
};

// Static method to log activity - IMPROVED ERROR HANDLING
auditLogSchema.statics.logActivity = async function (logData) {
  try {
    // Ensure user is null if not provided (for failed login attempts)
    const log = new this({
      ...logData,
      user: logData.user || null
    });
    await log.save();
    return log;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw - just return null to avoid blocking the main operation
    return null;
  }
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = function (userId, options = {}) {
  const { limit = 50, skip = 0, action = null, startDate = null, endDate = null } = options;

  const query = { user: userId };

  if (action) {
    query.action = action;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('user', 'firstName lastName email role')
    .lean();
};

// Static method to get resource history
auditLogSchema.statics.getResourceHistory = function (resourceType, resourceId) {
  return this.find({
    resourceType: resourceType,
    resourceId: resourceId
  })
    .sort({ createdAt: -1 })
    .populate('user', 'firstName lastName email role')
    .lean();
};

// Static method to get suspicious activities
auditLogSchema.statics.getSuspiciousActivities = function (options = {}) {
  const { limit = 100, skip = 0 } = options;

  return this.find({ isSuspicious: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('user', 'firstName lastName email role')
    .lean();
};

// Static method to get failed login attempts
auditLogSchema.statics.getFailedLogins = function (options = {}) {
  const { hours = 24, ipAddress = null } = options;

  const query = {
    action: 'login',
    status: 'failure',
    createdAt: { $gte: new Date(Date.now() - hours * 60 * 60 * 1000) }
  };

  if (ipAddress) {
    query.ipAddress = ipAddress;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('user', 'firstName lastName email')
    .lean();
};

// Static method to get activity statistics
auditLogSchema.statics.getStatistics = async function (options = {}) {
  const { startDate, endDate } = options;

  const matchStage = {};
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        successCount: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        },
        failureCount: {
          $sum: { $cond: [{ $eq: ['$status', 'failure'] }, 1, 0] }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const totalLogs = await this.countDocuments(matchStage);
  const suspiciousCount = await this.countDocuments({ ...matchStage, isSuspicious: true });
  const unreviewedCount = await this.countDocuments({ ...matchStage, isReviewed: false });

  return {
    totalLogs,
    suspiciousCount,
    unreviewedCount,
    byAction: stats
  };
};

// Static method to detect anomalies
auditLogSchema.statics.detectAnomalies = async function (userId, hours = 24) {
  const recentLogs = await this.find({
    user: userId,
    createdAt: { $gte: new Date(Date.now() - hours * 60 * 60 * 1000) }
  });

  const anomalies = [];

  // Check for unusual IP addresses
  const ipAddresses = [...new Set(recentLogs.map((log) => log.ipAddress))];
  if (ipAddresses.length > 3) {
    anomalies.push({
      type: 'multiple-ips',
      message: `User logged in from ${ipAddresses.length} different IP addresses`,
      severity: 'medium'
    });
  }

  // Check for failed login attempts
  const failedLogins = recentLogs.filter(
    (log) => log.action === 'login' && log.status === 'failure'
  );
  if (failedLogins.length > 5) {
    anomalies.push({
      type: 'multiple-failed-logins',
      message: `${failedLogins.length} failed login attempts detected`,
      severity: 'high'
    });
  }

  // Check for unusual activity volume
  if (recentLogs.length > 1000) {
    anomalies.push({
      type: 'high-activity-volume',
      message: `Unusually high activity: ${recentLogs.length} actions in ${hours} hours`,
      severity: 'medium'
    });
  }

  return anomalies;
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;