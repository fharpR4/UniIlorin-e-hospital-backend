const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, paginatedResponse } = require('../utils/responseHandler');
const { paginate, buildPaginationMeta } = require('../utils/helpers');

// Get user notifications
exports.getUserNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isRead } = req.query;

  const result = await notificationService.getUserNotifications(req.user._id, {
    page,
    limit,
    isRead
  });

  paginatedResponse(res, result.notifications, result.pagination, 'Notifications retrieved');
});

// Get unread count
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user._id);
  successResponse(res, { count }, 'Unread count retrieved');
});

// Mark as read
exports.markAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAsRead(req.params.id);
  successResponse(res, null, 'Notification marked as read');
});

// Mark all as read
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user._id);
  successResponse(res, null, 'All notifications marked as read');
});

module.exports = exports;