const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { validateUploadedFiles, IMAGE_AND_PDF_MIMES } = require('../middleware/uploadMiddleware');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads/misc exists (for any unknown fieldnames)
const miscDir = 'uploads/misc';
if (!fs.existsSync(miscDir)) fs.mkdirSync(miscDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'signature_image') {
            cb(null, 'uploads/signatures');
        } else if (file.fieldname === 'id_image') {
            cb(null, 'uploads/ssn_cards');
        } else {
            cb(null, 'uploads/misc');
        }
    },
    filename: (req, file, cb) => {
        const prefix = file.fieldname === 'signature_image' ? 'signature' : 'id';
        cb(null, `${prefix}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Public — fetch available document types (used by frontend wizard)
router.get('/document-types', requestController.getDocumentTypes);

router.use(authenticate, requireRole('parent'));

router.post('/create',
    upload.fields([
        { name: 'signature_image', maxCount: 1 },
        { name: 'id_image', maxCount: 1 }
    ]),
    validateUploadedFiles(IMAGE_AND_PDF_MIMES),
    requestController.createRequest
);
router.get('/my-requests', requestController.getMyRequests);
router.get('/', requestController.getMyRequests);
router.get('/:request_id', requestController.getRequestById);

module.exports = router;
