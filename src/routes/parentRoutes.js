const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');
const authenticate = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { uploadSSN, uploadProfilePicture } = require('../middleware/uploadMiddleware');

router.use(authenticate, requireRole('parent'));

router.get('/profile', parentController.getProfile);
router.patch('/profile', parentController.updateProfile);
router.post('/upload-ssn-card', uploadSSN.single('ssn_image'), parentController.uploadSSNCard);
router.post('/upload-profile-picture', uploadProfilePicture.single('profile_picture'), parentController.uploadProfilePicture);

module.exports = router;
