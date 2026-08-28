const studentService = require('../services/studentService');

/**
 * Controller to handle student search queries.
 */
async function searchStudents(req, res) {
  try {
    const query = req.query.q || '';
    const students = await studentService.searchStudents(query);
    return res.json({ success: true, students });
  } catch (error) {
    console.error('Error searching students:', error);
    return res.status(500).json({ success: false, message: 'Failed to search student database' });
  }
}

/**
 * Controller to fetch student by ID.
 */
async function getStudentById(req, res) {
  try {
    const { id } = req.params;
    const student = await studentService.getStudentById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    return res.json({ success: true, student });
  } catch (error) {
    console.error('Error getting student by ID:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch student details' });
  }
}

module.exports = {
  searchStudents,
  getStudentById,
};
