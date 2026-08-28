const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const adminNotificationController = require('../controllers/adminNotificationController');

router.use(authenticate, requireRole('admin'));

router.post('/staff', superAdminController.createStaffUser);
router.get('/staff', superAdminController.getAllStaffUsers);
router.get('/staff/:staff_id', superAdminController.getStaffUserById);
router.post('/staff/:staff_id/permissions', superAdminController.updateStaffPermissions);
router.delete('/staff/:staff_id', superAdminController.deleteStaffUser);
router.get('/stats', superAdminController.getDetailedStats);

router.get('/users', superAdminController.getAllPublicUsers);
router.post('/override-password', superAdminController.overridePassword);

router.get('/pricing', superAdminController.getDocumentPricing);
router.patch('/pricing/:id', superAdminController.updateDocumentPrice);

// Notification Management
router.get('/notifications/templates', adminNotificationController.getTemplates);
router.patch('/notifications/templates/:id', adminNotificationController.updateTemplate);
router.get('/notifications/settings', adminNotificationController.getSettings);
router.patch('/notifications/settings', adminNotificationController.updateSettings);
router.post('/notifications/broadcast', adminNotificationController.broadcastNotification);
router.get('/notifications/logs', adminNotificationController.getNotificationLogs);

module.exports = router;
