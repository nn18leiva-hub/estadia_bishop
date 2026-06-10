const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.use(authenticate, requireRole('staff'));

router.get('/requests', staffController.getAllRequests);
router.get('/requests/:id', staffController.getRequestById);
router.post('/verify-parent', staffController.verifyParent);
router.post('/verify-payment', staffController.verifyPayment);
router.post('/update-request-status', staffController.updateRequestStatus);

module.exports = router;
