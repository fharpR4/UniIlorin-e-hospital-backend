const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  toggleUserStatus,
  getSystemStatistics,
  getAuditLogs
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.use(protect);
router.use(authorize('admin'));

router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.get('/statistics', getSystemStatistics);
router.get('/audit-logs', getAuditLogs);

module.exports = router;