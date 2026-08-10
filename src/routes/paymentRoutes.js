const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { uploadReceipt, validateUploadedFiles, IMAGE_AND_PDF_MIMES } = require('../middleware/uploadMiddleware');

router.use(authenticate, requireRole('parent'));

router.get('/instructions', paymentController.getInstructions);
router.post('/upload-receipt', uploadReceipt.single('receipt_image'), validateUploadedFiles(IMAGE_AND_PDF_MIMES), paymentController.uploadReceipt);

module.exports = router;
