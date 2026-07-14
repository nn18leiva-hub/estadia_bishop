const db = require('../config/db');
const bcrypt = require('bcrypt');

// Helper to convert DB permissions JSON object to frontend array of string keys
const mapPermissionsToFrontend = (permissionsObj) => {
  if (!permissionsObj || typeof permissionsObj !== 'object') return [];
  return Object.keys(permissionsObj).filter(k => permissionsObj[k] === true);
};

// Helper to convert frontend array of permission strings back to DB JSON object
const mapPermissionsToDB = (permissionsArray) => {
  const defaultPermissions = {
    view_requests: false,
    manage_requests: false,
    approve_documents: false,
    view_payments: false,
    verify_payments: false,
    view_users: false,
    manage_users: false,
    manage_permissions: false,
    view_verifications: false,
    approve_verifications: false
  };

  if (Array.isArray(permissionsArray)) {
    permissionsArray.forEach(p => {
      if (p in defaultPermissions) {
        defaultPermissions[p] = true;
      }
    });
  }
  return defaultPermissions;
};

const getUsers = async (req, res) => {
  try {
    const { role = 'staff', search = '', status = '' } = req.query;
    const searchPattern = `%${search}%`;

    if (role === 'staff') {
      let queryText = `
        SELECT staff_id, full_name, email, role, last_activity, created_at, permissions
        FROM staff
        WHERE 1=1
      `;
      const queryParams = [];

      if (search) {
        queryParams.push(searchPattern);
        queryText += ` AND (full_name ILIKE $${queryParams.length} OR email ILIKE $${queryParams.length} OR role ILIKE $${queryParams.length})`;
      }

      // Staff are always active in this system, so if status is specified as non-active, return empty
      if (status && status !== 'active') {
        return res.json([]);
      }

      const result = await db.query(queryText, queryParams);
      const mapped = result.rows.map(row => ({
        id: `staff-${row.staff_id}`,
        name: row.full_name,
        email: row.email,
        role: row.role,
        role_title: row.role === 'admin' || row.role === 'super_admin' ? 'Admin' : (row.role === 'staff' ? 'Staff' : 'Viewer'),
        status: 'active',
        last_login: row.last_activity,
        created_at: row.created_at,
        permissions: mapPermissionsToFrontend(row.permissions)
      }));

      res.json(mapped);
    } else {
      // role === 'parent'
      let queryText = `
        SELECT parent_id, full_name, email, phone, user_type, verified, dob, created_at, last_activity
        FROM parents
        WHERE 1=1
      `;
      const queryParams = [];

      if (search) {
        queryParams.push(searchPattern);
        queryText += ` AND (full_name ILIKE $${queryParams.length} OR email ILIKE $${queryParams.length})`;
      }

      if (status) {
        if (status === 'active') {
          queryText += ` AND verified = TRUE`;
        } else if (status === 'pending') {
          queryText += ` AND verified = FALSE`;
        } else if (status === 'deactivated') {
          return res.json([]); // Parents cannot be deactivated in the standard schema
        }
      }

      const result = await db.query(queryText, queryParams);
      const mapped = result.rows.map(row => ({
        id: `parent-${row.parent_id}`,
        name: row.full_name,
        email: row.email,
        phone: row.phone,
        role: 'parent',
        role_title: row.user_type === 'past_student' ? 'Past Student' : 'Parent',
        status: row.verified ? 'active' : 'pending',
        last_login: row.last_activity,
        created_at: row.created_at,
        dob: row.dob,
        permissions: []
      }));

      res.json(mapped);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error listing users.' });
  }
};

const getUserStats = async (req, res) => {
  try {
    const staffCountRes = await db.query('SELECT COUNT(*) FROM staff');
    const parentCountRes = await db.query('SELECT COUNT(*) FROM parents');

    // Online counts (active in last 15 minutes)
    const activeStaffRes = await db.query("SELECT COUNT(*) FROM staff WHERE last_activity > NOW() - INTERVAL '15 minutes'");
    const activeParentsRes = await db.query("SELECT COUNT(*) FROM parents WHERE last_activity > NOW() - INTERVAL '15 minutes'");

    const totalStaff = parseInt(staffCountRes.rows[0].count);
    const totalParents = parseInt(parentCountRes.rows[0].count);
    const activeNow = parseInt(activeStaffRes.rows[0].count) + parseInt(activeParentsRes.rows[0].count);

    res.json({
      totalStaff,
      totalParents,
      activeNow
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching user stats.' });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (id.startsWith('staff-')) {
      const staffId = parseInt(id.replace('staff-', ''));
      const result = await db.query(
        'SELECT staff_id, full_name, email, role, last_activity, created_at, permissions FROM staff WHERE staff_id = $1',
        [staffId]
      );
      if (result.rows.length === 0) return res.status(404).json({ message: 'Staff user not found.' });

      const row = result.rows[0];
      return res.json({
        id: `staff-${row.staff_id}`,
        name: row.full_name,
        email: row.email,
        role: row.role,
        role_title: row.role === 'admin' || row.role === 'super_admin' ? 'Admin' : (row.role === 'staff' ? 'Staff' : 'Viewer'),
        status: 'active',
        last_login: row.last_activity,
        created_at: row.created_at,
        permissions: mapPermissionsToFrontend(row.permissions)
      });
    } else if (id.startsWith('parent-')) {
      const parentId = parseInt(id.replace('parent-', ''));
      const result = await db.query(
        'SELECT parent_id, full_name, email, phone, user_type, verified, dob, created_at, last_activity FROM parents WHERE parent_id = $1',
        [parentId]
      );
      if (result.rows.length === 0) return res.status(404).json({ message: 'Parent user not found.' });

      const row = result.rows[0];
      return res.json({
        id: `parent-${row.parent_id}`,
        name: row.full_name,
        email: row.email,
        phone: row.phone,
        role: 'parent',
        role_title: row.user_type === 'past_student' ? 'Past Student' : 'Parent',
        status: row.verified ? 'active' : 'pending',
        last_login: row.last_activity,
        created_at: row.created_at,
        dob: row.dob,
        permissions: []
      });
    } else {
      // Plain integer fallback: check staff first, then parents
      const intId = parseInt(id);
      if (isNaN(intId)) return res.status(400).json({ message: 'Invalid ID format.' });

      const staffResult = await db.query(
        'SELECT staff_id, full_name, email, role, last_activity, created_at, permissions FROM staff WHERE staff_id = $1',
        [intId]
      );

      if (staffResult.rows.length > 0) {
        const row = staffResult.rows[0];
        return res.json({
          id: `staff-${row.staff_id}`,
          name: row.full_name,
          email: row.email,
          role: row.role,
          role_title: row.role === 'admin' || row.role === 'super_admin' ? 'Admin' : (row.role === 'staff' ? 'Staff' : 'Viewer'),
          status: 'active',
          last_login: row.last_activity,
          created_at: row.created_at,
          permissions: mapPermissionsToFrontend(row.permissions)
        });
      }

      const parentResult = await db.query(
        'SELECT parent_id, full_name, email, phone, user_type, verified, dob, created_at, last_activity FROM parents WHERE parent_id = $1',
        [intId]
      );

      if (parentResult.rows.length > 0) {
        const row = parentResult.rows[0];
        return res.json({
          id: `parent-${row.parent_id}`,
          name: row.full_name,
          email: row.email,
          phone: row.phone,
          role: 'parent',
          role_title: row.user_type === 'past_student' ? 'Past Student' : 'Parent',
          status: row.verified ? 'active' : 'pending',
          last_login: row.last_activity,
          created_at: row.created_at,
          dob: row.dob,
          permissions: []
        });
      }

      return res.status(404).json({ message: 'User not found in any directory.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching user detail.' });
  }
};

const updateUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body; // array of permission strings

    let staffId = null;
    if (id.startsWith('staff-')) {
      staffId = parseInt(id.replace('staff-', ''));
    } else if (!id.startsWith('parent-')) {
      staffId = parseInt(id);
    }

    if (!staffId || isNaN(staffId)) {
      return res.status(400).json({ message: 'Permissions can only be updated for staff users.' });
    }

    const permissionsObj = mapPermissionsToDB(permissions);

    const result = await db.query(
      'UPDATE staff SET permissions = $1 WHERE staff_id = $2 RETURNING staff_id, permissions',
      [permissionsObj, staffId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Staff user not found.' });
    }

    res.json({
      message: 'Permissions updated successfully.',
      permissions: mapPermissionsToFrontend(result.rows[0].permissions)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating permissions.' });
  }
};

const inviteUser = async (req, res) => {
  try {
    const { name, email, phone, role, department } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Name, email, and role are required.' });
    }

    // Role mapping: frontend role to db role
    let dbRole = 'viewer';
    if (role === 'staff') dbRole = 'staff';
    if (role === 'admin' || role === 'super_admin' || role === 'superadmin') dbRole = 'admin';

    // Check email uniqueness across both tables
    const staffEmailCheck = await db.query('SELECT staff_id FROM staff WHERE email = $1', [email]);
    const parentEmailCheck = await db.query('SELECT parent_id FROM parents WHERE email = $1', [email]);

    if (staffEmailCheck.rows.length > 0 || parentEmailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email address is already in use.' });
    }

    // Generate random temporary password
    const tempPassword = Math.random().toString(36).slice(-10) + '1!';
    const password_hash = await bcrypt.hash(tempPassword, 10);

    // Default permissions based on role
    let permissionsObj = {
      view_requests: true,
      manage_requests: dbRole !== 'viewer',
      approve_documents: dbRole === 'admin',
      view_payments: dbRole !== 'viewer',
      verify_payments: dbRole !== 'viewer',
      view_users: true,
      manage_users: dbRole !== 'viewer',
      manage_permissions: dbRole === 'admin',
      view_verifications: true,
      approve_verifications: dbRole !== 'viewer'
    };

    const newStaff = await db.query(
      'INSERT INTO staff (full_name, email, password_hash, role, permissions) VALUES ($1, $2, $3, $4, $5) RETURNING staff_id, full_name, email, role',
      [name, email, password_hash, dbRole, permissionsObj]
    );

    res.status(201).json({
      message: 'Invitation sent and user created.',
      user: {
        id: `staff-${newStaff.rows[0].staff_id}`,
        name: newStaff.rows[0].full_name,
        email: newStaff.rows[0].email,
        role: newStaff.rows[0].role,
        tempPassword // Returned for test/simulated environment
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating invitation.' });
  }
};

module.exports = {
  getUsers,
  getUserStats,
  getUserById,
  updateUserPermissions,
  inviteUser
};
