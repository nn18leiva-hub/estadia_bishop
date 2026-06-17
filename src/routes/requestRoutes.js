const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const multer = require('multer');
const path = require('path');
const signatureStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/signatures'),
    filename: (req, file, cb) => cb(null, `signature-${Date.now()}${path.extname(file.originalname)}`)
});
const uploadSignature = multer({ storage: signatureStorage });

// Public — fetch available document types (used by frontend wizard)
router.get('/document-types', requestController.getDocumentTypes);

router.use(authenticate, requireRole('parent'));

router.post('/create', uploadSignature.single('signature_image'), requestController.createRequest);
router.get('/my-requests', requestController.getMyRequests);
router.get('/', requestController.getMyRequests);
router.get('/:request_id', requestController.getRequestById);

module.exports = router;
