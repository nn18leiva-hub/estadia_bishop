const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.use(authenticate, requireRole('super_admin'));

router.post('/staff', superAdminController.createStaffUser);
router.get('/staff', superAdminController.getAllStaffUsers);
router.get('/staff/:staff_id', superAdminController.getStaffUserById);
router.post('/staff/:staff_id/permissions', superAdminController.updateStaffPermissions);
router.delete('/staff/:staff_id', superAdminController.deleteStaffUser);
router.get('/stats', superAdminController.getDetailedStats);

router.get('/users', superAdminController.getAllPublicUsers);
router.post('/override-password', superAdminController.overridePassword);

module.exports = router;
