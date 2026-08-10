const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authMiddleware');

// Rate limiter: max 10 requests per 15 minutes per IP for sensitive auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Stricter limiter for password reset (max 5 per 15 min)
const resetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many password reset attempts. Please try again after 15 minutes.' }
});

router.post('/register', authLimiter, authController.registerParent);
router.post('/login', authLimiter, authController.login);
router.post('/forgot-password', resetLimiter, authController.forgotPassword);
router.post('/reset-password', resetLimiter, authController.resetPassword);

router.post('/request-profile-code', authenticate, authController.requestProfileCode);
router.post('/change-profile-password', authenticate, authController.changeProfilePassword);

module.exports = router;
