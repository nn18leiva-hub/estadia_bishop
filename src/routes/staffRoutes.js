const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { uploadProfilePicture, uploadDocument } = require('../middleware/uploadMiddleware');

router.use(authenticate, requireRole('staff'));

router.get('/profile', staffController.getProfile);
router.patch('/profile', staffController.updateProfile);
router.post('/profile/upload-picture', uploadProfilePicture.single('profile_picture'), staffController.uploadProfilePicture);

router.get('/requests', staffController.getAllRequests);
router.get('/requests/:id', staffController.getRequestById);
router.post('/requests/:id/upload', uploadDocument.single('document_file'), staffController.uploadDocument);
router.patch('/requests/:id/status', staffController.updateRequestStatusById);
router.post('/verify-parent', staffController.verifyParent);
router.post('/verify-payment', staffController.verifyPayment);
router.post('/update-request-status', staffController.updateRequestStatus);

router.get('/stats', staffController.getStats);
router.get('/queue', staffController.getUrgentQueue);
router.get('/payments', staffController.getPayments);
router.patch('/payments/:id/verify', staffController.verifyPaymentById);

module.exports = router;
