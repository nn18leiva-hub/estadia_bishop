const db = require('../config/db');

// Fallback seed students array for instant usage/testing even when database is not populated
const FALLBACK_STUDENTS = [
  { student_id: 1, student_code: 'STU-1001', full_name: 'Alex Johnson', dob: '2008-04-12', class_grade: 'Sr Science', homeroom_teacher: 'Mr. Robert Davis', parent_email: 'parent@example.com' },
  { student_id: 2, student_code: 'STU-1002', full_name: 'Brianna Smith', dob: '2009-09-25', class_grade: 'F2', homeroom_teacher: 'Mrs. Sarah Thompson', parent_email: 'smithfamily@example.com' },
  { student_id: 3, student_code: 'STU-1003', full_name: 'Carlos Gomez', dob: '2007-11-03', class_grade: 'Sr Business', homeroom_teacher: 'Mr. Michael Martinez', parent_email: 'gomez.parent@example.com' },
  { student_id: 4, student_code: 'STU-1004', full_name: 'Diana Martinez', dob: '2008-01-18', class_grade: 'J General', homeroom_teacher: 'Ms. Emily White', parent_email: 'diana.mom@example.com' },
  { student_id: 5, student_code: 'STU-1005', full_name: 'Ethan Brown', dob: '2009-06-30', class_grade: 'F1', homeroom_teacher: 'Mr. David Lee', parent_email: 'browns@example.com' },
];

/**
 * Search students by name or student code.
 * Switches between external DB endpoint and local database/mock dataset.
 *
 * @param {string} query Search query string
 * @returns {Promise<Array>} List of matching student objects
 */
async function searchStudents(query = '') {
  const searchTerm = query.trim().toLowerCase();

  // 1. External DB integration hook (when external database API is ready)
  if (process.env.USE_EXTERNAL_STUDENT_DB === 'true' && process.env.EXTERNAL_STUDENT_DB_URL) {
    return await fetchFromExternalDB(searchTerm);
  }

  // 2. Query local database table if available
  try {
    const result = await db.query(
      `SELECT student_id, student_code, full_name, TO_CHAR(dob, 'YYYY-MM-DD') as dob, class_grade, homeroom_teacher, parent_email
       FROM students
       WHERE LOWER(full_name) LIKE $1 OR LOWER(student_code) LIKE $1
       ORDER BY full_name ASC LIMIT 20`,
      [`%${searchTerm}%`]
    );

    if (result.rows && result.rows.length > 0) {
      return result.rows;
    }
  } catch (err) {
    console.warn('[StudentService] Database table lookup fallback:', err.message);
  }

  // 3. Fallback to mock dataset if local DB table is unpopulated/empty
  if (!searchTerm) return FALLBACK_STUDENTS;
  return FALLBACK_STUDENTS.filter(s =>
    s.full_name.toLowerCase().includes(searchTerm) ||
    s.student_code.toLowerCase().includes(searchTerm) ||
    s.class_grade.toLowerCase().includes(searchTerm)
  );
}

/**
 * Get a specific student by ID or student code.
 *
 * @param {string|number} id Student ID or code
 * @returns {Promise<Object|null>} Student object or null
 */
async function getStudentById(id) {
  if (process.env.USE_EXTERNAL_STUDENT_DB === 'true' && process.env.EXTERNAL_STUDENT_DB_URL) {
    return await fetchFromExternalDBById(id);
  }

  try {
    const result = await db.query(
      `SELECT student_id, student_code, full_name, TO_CHAR(dob, 'YYYY-MM-DD') as dob, class_grade, homeroom_teacher, parent_email
       FROM students
       WHERE student_id = $1 OR student_code = $2`,
      [isNaN(id) ? -1 : parseInt(id, 10), id]
    );

    if (result.rows && result.rows[0]) {
      return result.rows[0];
    }
  } catch (err) {
    console.warn('[StudentService] Local DB getById fallback:', err.message);
  }

  return FALLBACK_STUDENTS.find(s => s.student_id === parseInt(id, 10) || s.student_code === id) || null;
}

/**
 * HTTP handler for querying a completely separate external server API.
 * Active when process.env.USE_EXTERNAL_STUDENT_DB === 'true' and process.env.EXTERNAL_STUDENT_DB_URL is set.
 */
async function fetchFromExternalDB(searchTerm) {
  const baseUrl = process.env.EXTERNAL_STUDENT_DB_URL.replace(/\/$/, '');
  const apiKey = process.env.EXTERNAL_STUDENT_DB_KEY || '';
  const searchEndpoint = `${baseUrl}?q=${encodeURIComponent(searchTerm)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const headers = { 'Accept': 'application/json' };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['X-API-Key'] = apiKey;
    }

    const response = await fetch(searchEndpoint, {
      method: 'GET',
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[StudentService] External server returned HTTP status ${response.status}`);
      return [];
    }

    const data = await response.json();
    const list = Array.isArray(data) ? data : (data.students || data.data || []);
    
    // Normalize data format from external server
    return list.map(item => ({
      student_id: item.student_id || item.id,
      student_code: item.student_code || item.code || item.student_id,
      full_name: item.full_name || item.fullName || item.name,
      dob: item.dob || item.date_of_birth || '',
      class_grade: item.class_grade || item.grade || item.class || '',
      homeroom_teacher: item.homeroom_teacher || item.teacher || item.home_room_teacher || '',
      parent_email: item.parent_email || item.email || ''
    }));
  } catch (err) {
    console.error('[StudentService] Error reaching external student server:', err.message);
    // Fallback to local DB search if external server call fails
    return [];
  }
}

async function fetchFromExternalDBById(id) {
  const baseUrl = process.env.EXTERNAL_STUDENT_DB_URL.replace(/\/$/, '');
  const apiKey = process.env.EXTERNAL_STUDENT_DB_KEY || '';
  const endpoint = `${baseUrl}/${encodeURIComponent(id)}`;

  try {
    const headers = { 'Accept': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await fetch(endpoint, { method: 'GET', headers });
    if (!response.ok) return null;
    const item = await response.json();
    const student = item.student || item;
    return {
      student_id: student.student_id || student.id,
      student_code: student.student_code || student.code,
      full_name: student.full_name || student.fullName || student.name,
      dob: student.dob || '',
      class_grade: student.class_grade || student.grade || '',
      homeroom_teacher: student.homeroom_teacher || student.teacher || '',
      parent_email: student.parent_email || ''
    };
  } catch (err) {
    console.error('[StudentService] Error fetching student by ID from external server:', err.message);
    return null;
  }
}

module.exports = {
  searchStudents,
  getStudentById,
};
