const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// Secure all admin routes to require admin role
router.use(authenticate, requireRole('admin'));

router.get('/users', adminController.getUsers);
router.get('/users/stats', adminController.getUserStats);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/permissions', adminController.updateUserPermissions);
router.post('/users/invite', adminController.inviteUser);

module.exports = router;
