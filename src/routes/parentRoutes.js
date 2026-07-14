const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { uploadProfilePicture } = require('../middleware/uploadMiddleware');

router.use(authenticate, requireRole('parent'));

router.get('/profile', parentController.getProfile);
router.patch('/profile', parentController.updateProfile);
router.post('/upload-profile-picture', uploadProfilePicture.single('profile_picture'), parentController.uploadProfilePicture);

// Notification endpoints
router.get('/notifications', parentController.getNotifications);
router.patch('/notifications/read-all', parentController.markAllNotificationsRead);
router.patch('/notifications/:id/read', parentController.markNotificationRead);

module.exports = router;
