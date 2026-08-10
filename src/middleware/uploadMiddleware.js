const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure all uploads subdirectories exist
const uploadDirs = [
    'uploads',
    'uploads/ssn_cards',
    'uploads/payment_receipts',
    'uploads/profile_pictures',
    'uploads/signatures',
    'uploads/documents'
];

uploadDirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', '..', dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

/**
 * Checks the magic bytes (file signature) of a buffer to determine the real
 * MIME type — independent of whatever the client claims in Content-Type.
 * Returns the detected MIME type string, or null if unrecognised.
 */
const detectMimeFromBuffer = (buffer) => {
    if (!buffer || buffer.length < 4) return null;

    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        return 'image/jpeg';
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
        buffer[0] === 0x89 && buffer[1] === 0x50 &&
        buffer[2] === 0x4E && buffer[3] === 0x47
    ) {
        return 'image/png';
    }

    // WebP: RIFF????WEBP  (bytes 0-3 = "RIFF", bytes 8-11 = "WEBP")
    if (
        buffer.length >= 12 &&
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) {
        return 'image/webp';
    }

    // PDF: %PDF
    if (
        buffer[0] === 0x25 && buffer[1] === 0x50 &&
        buffer[2] === 0x44 && buffer[3] === 0x46
    ) {
        return 'application/pdf';
    }

    return null;
};

/**
 * Post-upload middleware factory. Validates the magic bytes of every uploaded
 * file against an allowedMimes list. Deletes the saved file and returns 400 if
 * the content doesn't match a permitted type.
 *
 * Usage (after any multer middleware):
 *   router.post('/upload', upload.single('file'), validateUploadedFiles(['image/jpeg', 'application/pdf']), controller);
 */
const validateUploadedFiles = (allowedMimes) => (req, res, next) => {
    const files = req.file ? [req.file] : Object.values(req.files || {}).flat();
    if (files.length === 0) return next();

    for (const file of files) {
        try {
            // Read first 12 bytes (enough for all supported signatures)
            const buf = Buffer.alloc(12);
            const fd = fs.openSync(file.path, 'r');
            fs.readSync(fd, buf, 0, 12, 0);
            fs.closeSync(fd);

            const detected = detectMimeFromBuffer(buf);
            if (!detected || !allowedMimes.includes(detected)) {
                // Delete the invalid file immediately
                try { fs.unlinkSync(file.path); } catch {}
                return res.status(400).json({
                    message: `Invalid file content detected in "${file.fieldname}". Only ${allowedMimes.join(', ')} files are permitted.`
                });
            }
        } catch (err) {
            // Clean up on error
            try { fs.unlinkSync(file.path); } catch {}
            return next(err);
        }
    }

    next();
};

// --- Allowed MIME sets ---
const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const IMAGE_AND_PDF_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// --- MIME header filter (first line of defence, magic bytes check is the second) ---
const imageFileFilter = (req, file, cb) => {
    if (IMAGE_MIMES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, and WebP images are allowed.'), false);
    }
};

const fileFilter = (req, file, cb) => {
    if (IMAGE_AND_PDF_MIMES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, WebP and PDF are allowed.'), false);
    }
};

// --- Storage engines ---
const receiptStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/payment_receipts');
    },
    filename: (req, file, cb) => {
        const reqId = req.body.request_id || 'unknown';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${reqId}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const profilePictureStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profile_pictures');
    },
    filename: (req, file, cb) => {
        const userId = req.user?.id || 'unknown';
        const uniqueSuffix = Date.now();
        cb(null, `profile-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const documentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/documents');
    },
    filename: (req, file, cb) => {
        const reqId = req.params.id || 'unknown';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `doc-${reqId}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// --- Multer upload instances ---
const uploadReceipt = multer({
    storage: receiptStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter
});

const uploadProfilePicture = multer({
    storage: profilePictureStorage,
    limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
    fileFilter: imageFileFilter
});

const uploadDocument = multer({
    storage: documentStorage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
    fileFilter
});

module.exports = {
    uploadReceipt,
    uploadProfilePicture,
    uploadDocument,
    validateUploadedFiles,
    IMAGE_MIMES,
    IMAGE_AND_PDF_MIMES
};
