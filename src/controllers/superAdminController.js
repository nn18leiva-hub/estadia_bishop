const db = require('../config/db');
const bcrypt = require('bcrypt');

const createStaffUser = async (req, res) => {
    try {
        const { full_name, email, password, role, permissions } = req.body;
        
        if (!['viewer', 'staff', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role.' });
        }

        const emailCheck = await db.query('SELECT staff_id FROM staff WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Email already registered.' });
        }

        // Default or random password if none provided (for invitation flow)
        const effectivePassword = password || Math.random().toString(36).slice(-12);
        const password_hash = await bcrypt.hash(effectivePassword, 10);

        const defaultPermissions = {
            manage_requests: true,
            view_financials: false,
            admin_access: false,
            verify_credentials: true
        };

        const newStaff = await db.query(
            'INSERT INTO staff (full_name, email, password_hash, role, permissions) VALUES ($1, $2, $3, $4, $5) RETURNING staff_id, full_name, email, role, permissions',
            [full_name, email, password_hash, role, permissions || defaultPermissions]
        );

        res.status(201).json({ message: 'Staff user created.', user: newStaff.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
};

const getStaffUserById = async (req, res) => {
    try {
        const { staff_id } = req.params;
        const result = await db.query('SELECT staff_id, full_name, email, role, permissions, created_at, last_activity FROM staff WHERE staff_id = $1', [staff_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching user.' });
    }
};

const updateStaffPermissions = async (req, res) => {
    try {
        const { staff_id } = req.params;
        const { permissions } = req.body;
        
        const result = await db.query(
            'UPDATE staff SET permissions = $1 WHERE staff_id = $2 RETURNING staff_id, permissions',
            [permissions, staff_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        res.json({ message: 'Permissions updated successfully.', user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating permissions.' });
    }
};

const getAllStaffUsers = async (req, res) => {
    try {
        const result = await db.query('SELECT staff_id, full_name, email, role, permissions, created_at FROM staff ORDER BY role, full_name');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
};

const deleteStaffUser = async (req, res) => {
    try {
        const { staff_id } = req.params;
        
        if (parseInt(staff_id) === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own account.' });
        }

        const result = await db.query('DELETE FROM staff WHERE staff_id = $1 RETURNING staff_id', [staff_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        res.json({ message: 'Staff user deleted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error deleting staff user.' });
    }
};

const getAllPublicUsers = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT parent_id as id, full_name, email, phone, user_type, verified, dob, created_at 
            FROM parents
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching public users.' });
    }
};

const overridePassword = async (req, res) => {
    try {
        const { targetEmail, newPassword } = req.body;
        if (!targetEmail || !newPassword) return res.status(400).json({ message: 'Email and new password required.' });

        const password_hash = await bcrypt.hash(newPassword, 10);
        
        let updateRes = await db.query('UPDATE parents SET password_hash = $1 WHERE email = $2 RETURNING parent_id', [password_hash, targetEmail]);
        if (updateRes.rows.length === 0) {
            updateRes = await db.query('UPDATE staff SET password_hash = $1 WHERE email = $2 RETURNING staff_id', [password_hash, targetEmail]);
        }

        if (updateRes.rows.length === 0) {
            return res.status(404).json({ message: 'User not found in any directory.' });
        }

        res.json({ message: `Successfully overrode password for ${targetEmail}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error attempting to override password.' });
    }
};

const getDetailedStats = async (req, res) => {
    try {
        const ONLINE_WINDOW = '15 minutes';

        // Registered Counts
        const regStaff = await db.query("SELECT role, count(*) FROM staff GROUP BY role");
        const regParents = await db.query("SELECT user_type, count(*) FROM parents GROUP BY user_type");

        // Online Counts (Active in last 15 mins)
        const onlineStaff = await db.query(`SELECT role, count(*) FROM staff WHERE last_activity > NOW() - INTERVAL '${ONLINE_WINDOW}' GROUP BY role`);
        const onlineParents = await db.query(`SELECT user_type, count(*) FROM parents WHERE last_activity > NOW() - INTERVAL '${ONLINE_WINDOW}' GROUP BY user_type`);

        res.json({
            registered: {
                staff: regStaff.rows,
                parents: regParents.rows
            },
            online: {
                staff: onlineStaff.rows,
                parents: onlineParents.rows
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching statistics.' });
    }
};

// GET /api/superadmin/pricing — list all document types with base_price
const getDocumentPricing = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT document_type_id, name, description, is_auto_generated, requires_payment, base_price FROM document_types ORDER BY document_type_id'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching pricing.' });
    }
};

// PATCH /api/superadmin/pricing/:id — update base_price for a document type
const updateDocumentPrice = async (req, res) => {
    try {
        const { id } = req.params;
        const { base_price } = req.body;

        if (base_price === undefined || base_price === null || isNaN(parseFloat(base_price))) {
            return res.status(400).json({ message: 'A valid base_price is required.' });
        }
        if (parseFloat(base_price) < 0) {
            return res.status(400).json({ message: 'Price cannot be negative.' });
        }

        const result = await db.query(
            'UPDATE document_types SET base_price = $1 WHERE document_type_id = $2 RETURNING document_type_id, name, base_price',
            [parseFloat(base_price), id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Document type not found.' });
        }

        res.json({ message: 'Price updated successfully.', documentType: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating price.' });
    }
};

module.exports = { 
    createStaffUser, 
    getStaffUserById,
    updateStaffPermissions,
    getAllStaffUsers, 
    deleteStaffUser, 
    getAllPublicUsers, 
    overridePassword,
    getDetailedStats,
    getDocumentPricing,
    updateDocumentPrice
};
