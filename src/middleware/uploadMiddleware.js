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

const ssnStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/ssn_cards');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

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

const imageFileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, and WebP images are allowed.'), false);
    }
};

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, WebP and PDF are allowed.'), false);
    }
};

const uploadSSN = multer({
    storage: ssnStorage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
    fileFilter
});

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

const uploadDocument = multer({
    storage: documentStorage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
    fileFilter
});

module.exports = { uploadSSN, uploadReceipt, uploadProfilePicture, uploadDocument };
