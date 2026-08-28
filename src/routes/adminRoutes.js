const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const adminNotificationController = require('../controllers/adminNotificationController');

// Secure all admin routes to require admin role
router.use(authenticate, requireRole('admin'));

router.get('/users', adminController.getUsers);
router.get('/users/stats', adminController.getUserStats);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/permissions', adminController.updateUserPermissions);
router.post('/users/invite', adminController.inviteUser);

// Notification Management
router.get('/notifications/templates', adminNotificationController.getTemplates);
router.patch('/notifications/templates/:id', adminNotificationController.updateTemplate);
router.get('/notifications/settings', adminNotificationController.getSettings);
router.patch('/notifications/settings', adminNotificationController.updateSettings);
router.post('/notifications/broadcast', adminNotificationController.broadcastNotification);
router.get('/notifications/logs', adminNotificationController.getNotificationLogs);

module.exports = router;
