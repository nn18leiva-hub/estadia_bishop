const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authenticate = require('../middleware/authMiddleware');

// Authenticated route for parents & staff to search/lookup student details
router.use(authenticate);

router.get('/search', studentController.searchStudents);
router.get('/:id', studentController.getStudentById);

module.exports = router;
