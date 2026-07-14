const db = require('../config/db');

const getProfile = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT staff_id, full_name, email, role, profile_picture_path, created_at FROM staff WHERE staff_id = $1',
            [req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Staff member not found.' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { full_name } = req.body;
        if (!full_name) return res.status(400).json({ message: 'full_name is required.' });

        const result = await db.query(
            'UPDATE staff SET full_name = $1 WHERE staff_id = $2 RETURNING staff_id, full_name, email, role, profile_picture_path, created_at',
            [full_name, req.user.id]
        );
        res.json({ message: 'Profile updated successfully.', user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating profile.' });
    }
};

const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Please upload an image.' });

        const imagePath = `uploads/profile_pictures/${req.file.filename}`;
        await db.query(
            'UPDATE staff SET profile_picture_path = $1 WHERE staff_id = $2',
            [imagePath, req.user.id]
        );
        res.json({ message: 'Profile picture updated successfully.', profile_picture_path: imagePath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during profile picture upload.' });
    }
};

const mapRequestKeys = (row) => {
    if (!row) return row;
    return {
        ...row,
        id: row.request_id,
        student_name: row.student_full_name,
        grade: row.student_graduation_year_or_years_attended,
        document_type: row.document_type_name,
        created_at: row.request_date,
        parent_verified: row.id_verified,
        student_id: null
    };
};

const getAllRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const documentType = req.query.documentType || '';
        const status = req.query.status || '';

        let queryText = `
            FROM document_requests dr
            JOIN parents p ON dr.parent_id = p.parent_id
            JOIN document_types dt ON dr.document_type_id = dt.document_type_id
            LEFT JOIN payments pmt ON dr.request_id = pmt.request_id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            params.push(status);
            queryText += ` AND dr.status = $${params.length}`;
        }

        if (documentType) {
            params.push(documentType);
            queryText += ` AND dt.name = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            const paramIdx = params.length;
            queryText += ` AND (p.full_name ILIKE $${paramIdx} OR dr.student_full_name ILIKE $${paramIdx} OR CAST(dr.request_id AS TEXT) ILIKE $${paramIdx} OR dt.name ILIKE $${paramIdx})`;
        }

        // Count total matching rows
        const countRes = await db.query(`SELECT COUNT(*) ${queryText}`, params);
        const total = parseInt(countRes.rows[0].count);

        // Fetch paginated rows
        params.push(limit, offset);
        const dataRes = await db.query(
            `SELECT dr.*, 
                    p.full_name as parent_name, 
                    p.email as parent_email, 
                    dr.id_verified as parent_verified, 
                    dr.id_image_path,
                    dt.name as document_type_name,
                    dt.requires_payment,
                    pmt.payment_id,
                    pmt.receipt_image_path,
                    pmt.verified as payment_verified
             ${queryText}
             ORDER BY dr.request_date DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        res.json({
            requests: dataRes.rows.map(mapRequestKeys),
            total
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
};

const getRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(`
            SELECT 
                dr.*, 
                p.full_name as parent_name, 
                p.email as parent_email, 
                p.phone as parent_phone,
                dr.id_verified as parent_verified, 
                dr.id_image_path,
                dt.name as document_type_name,
                dt.requires_payment,
                pmt.payment_id,
                pmt.receipt_image_path,
                pmt.transfer_reference,
                pmt.payment_date,
                pmt.verified as payment_verified
            FROM document_requests dr
            JOIN parents p ON dr.parent_id = p.parent_id
            JOIN document_types dt ON dr.document_type_id = dt.document_type_id
            LEFT JOIN payments pmt ON dr.request_id = pmt.request_id
            WHERE dr.request_id = $1
        `, [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Request not found.' });
        res.json(mapRequestKeys(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
};

const verifyParent = async (req, res) => {
    try {
        const { parent_id } = req.body;
        if (!parent_id) return res.status(400).json({ message: 'parent_id is required.' });

        await db.query('UPDATE parents SET verified = TRUE WHERE parent_id = $1', [parent_id]);
        
        // Progress any suspended requests
        await db.query(`UPDATE document_requests SET status = 'pending' WHERE parent_id = $1 AND status = 'pending_verification'`, [parent_id]);
        
        res.json({ message: 'Identity verified successfully. Suspended requests have been resumed to pending.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { payment_id } = req.body;
        if (!payment_id) return res.status(400).json({ message: 'payment_id is required.' });

        await db.query(
            'UPDATE payments SET verified = TRUE, verified_by_staff_id = $1 WHERE payment_id = $2', 
            [req.user.id, payment_id]
        );
        res.json({ message: 'Payment verified successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
};

const updateRequestStatus = async (req, res) => {
    try {
        const { request_id, status } = req.body;
        if (!request_id || !status) return res.status(400).json({ message: 'request_id and status are required.' });

        if (!['pending', 'ready_for_pickup', 'pending_verification', 'denied', 'completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status.' });
        }

        const reqResult = await db.query(
            `SELECT dr.*, dr.id_verified AS parent_verified, dt.requires_payment,
             COALESCE(pay.verified, FALSE) AS payment_verified
             FROM document_requests dr
             JOIN parents p ON dr.parent_id = p.parent_id
             JOIN document_types dt ON dr.document_type_id = dt.document_type_id
             LEFT JOIN payments pay ON dr.request_id = pay.request_id
             WHERE dr.request_id = $1`,
            [request_id]
        );
        if (reqResult.rows.length === 0) {
            return res.status(404).json({ message: 'Request not found.' });
        }
        const requestDetails = reqResult.rows[0];

        if (!requestDetails.parent_verified) {
            return res.status(403).json({ message: "Cannot modify request. The request's ID verification has not been approved yet." });
        }

        if (requestDetails.requires_payment && !requestDetails.payment_verified) {
            return res.status(403).json({ message: 'Cannot modify request. The payment has not been verified yet.' });
        }

        const updated = await db.query(
            'UPDATE document_requests SET status = $1 WHERE request_id = $2 RETURNING *',
            [status, request_id]
        );

        if (updated.rows.length === 0) {
            return res.status(404).json({ message: 'Request not found.' });
        }

        res.json({ message: 'Status updated successfully.', request: updated.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// PATCH /staff/requests/:id/status  — used by the React frontend
const VALID_STATUSES = ['pending', 'processing', 'ready', 'ready_for_pickup', 'issued', 'completed', 'action', 'cancelled', 'denied', 'pending_verification'];

const updateRequestStatusById = async (req, res) => {
    try {
        const { id } = req.params;
        let { status, staff_notes } = req.body;

        if (!status) return res.status(400).json({ message: 'status is required.' });

        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}.` });
        }

        // Normalize status for database consistency
        if (status === 'ready') status = 'ready_for_pickup';
        if (status === 'issued') status = 'completed';
        if (status === 'cancelled') status = 'denied';

        const reqResult = await db.query(
            `SELECT dr.*, dr.id_verified AS parent_verified, dt.requires_payment,
             COALESCE(pay.verified, FALSE) AS payment_verified
             FROM document_requests dr
             JOIN parents p ON dr.parent_id = p.parent_id
             JOIN document_types dt ON dr.document_type_id = dt.document_type_id
             LEFT JOIN payments pay ON dr.request_id = pay.request_id
             WHERE dr.request_id = $1`,
            [id]
        );
        if (reqResult.rows.length === 0) {
            return res.status(404).json({ message: 'Request not found.' });
        }
        const requestDetails = reqResult.rows[0];

        if (!requestDetails.parent_verified) {
            return res.status(403).json({ message: "Cannot modify request. The request's ID verification has not been approved yet." });
        }

        if (requestDetails.requires_payment && !requestDetails.payment_verified) {
            return res.status(403).json({ message: 'Cannot modify request. The payment has not been verified yet.' });
        }

        const fields = ['status = $1'];
        const values = [status];

        if (staff_notes !== undefined) {
            fields.push(`staff_notes = $${values.length + 1}`);
            values.push(staff_notes);
        }

        values.push(id);

        const updated = await db.query(
            `UPDATE document_requests SET ${fields.join(', ')} WHERE request_id = $${values.length} RETURNING *`,
            values
        );

        if (updated.rows.length === 0) {
            return res.status(404).json({ message: 'Request not found.' });
        }

        res.json({ message: 'Status updated successfully.', request: updated.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
};

const getStats = async (req, res) => {
    try {
        const pendingRes = await db.query("SELECT COUNT(*) FROM document_requests WHERE status IN ('pending', 'pending_verification')");
        const issuedRes = await db.query("SELECT COUNT(*) FROM document_requests WHERE status = 'issued'");
        const urgentRes = await db.query("SELECT COUNT(*) FROM document_requests WHERE processing_speed = 'urgent' AND status IN ('pending', 'processing')");
        
        res.json({
            pending: parseInt(pendingRes.rows[0].count),
            avgLeadTime: 2.4,
            issuedToday: parseInt(issuedRes.rows[0].count),
            urgent: parseInt(urgentRes.rows[0].count)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching stats.' });
    }
};

const getUrgentQueue = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const result = await db.query(`
            SELECT dr.*, dt.name as document_type_name, dr.student_full_name as student_name
            FROM document_requests dr
            JOIN document_types dt ON dr.document_type_id = dt.document_type_id
            JOIN parents p ON dr.parent_id = p.parent_id
            WHERE dr.status IN ('pending', 'processing')
            ORDER BY 
                CASE WHEN dr.processing_speed = 'urgent' THEN 1
                     WHEN dr.processing_speed = 'expedited' THEN 2
                     ELSE 3 END,
                dr.request_date ASC
            LIMIT $1
        `, [limit]);
        res.json(result.rows.map(mapRequestKeys));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching queue.' });
    }
};

const getPayments = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT pmt.payment_id as id, pmt.request_id, pmt.receipt_image_path, pmt.transfer_reference as reference, pmt.payment_date as created_at, pmt.verified,
                   p.full_name as parent_name, dr.fee as amount,
                   CASE WHEN pmt.verified = TRUE THEN 'verified' ELSE 'pending' END as payment_status
            FROM payments pmt
            JOIN document_requests dr ON pmt.request_id = dr.request_id
            JOIN parents p ON dr.parent_id = p.parent_id
            ORDER BY pmt.payment_date DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching payments.' });
    }
};

const verifyPaymentById = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(
            'UPDATE payments SET verified = TRUE, verified_by_staff_id = $1 WHERE payment_id = $2',
            [req.user.id, id]
        );
        
        const pmtRes = await db.query('SELECT request_id FROM payments WHERE payment_id = $1', [id]);
        if (pmtRes.rows.length > 0) {
            const reqId = pmtRes.rows[0].request_id;
            const reqRes = await db.query('SELECT status, parent_id FROM document_requests WHERE request_id = $1', [reqId]);
            if (reqRes.rows.length > 0) {
                const parentId = reqRes.rows[0].parent_id;
                const parentRes = await db.query('SELECT verified FROM parents WHERE parent_id = $1', [parentId]);
                const parentVerified = parentRes.rows[0]?.verified;
                const newStatus = parentVerified ? 'processing' : 'pending_verification';
                await db.query('UPDATE document_requests SET status = $1 WHERE request_id = $2', [newStatus, reqId]);
            }
        }
        
        res.json({ message: 'Payment verified successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error verifying payment.' });
    }
};

const uploadDocument = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) return res.status(400).json({ message: 'Please upload a document file.' });

        const docPath = `uploads/documents/${req.file.filename}`;

        const reqResult = await db.query(
            `SELECT dr.*, dr.id_verified AS parent_verified, dt.requires_payment,
             COALESCE(pay.verified, FALSE) AS payment_verified
             FROM document_requests dr
             JOIN parents p ON dr.parent_id = p.parent_id
             JOIN document_types dt ON dr.document_type_id = dt.document_type_id
             LEFT JOIN payments pay ON dr.request_id = pay.request_id
             WHERE dr.request_id = $1`,
            [id]
        );

        if (reqResult.rows.length === 0) {
            return res.status(404).json({ message: 'Request not found.' });
        }
        const requestDetails = reqResult.rows[0];

        if (!requestDetails.parent_verified) {
            return res.status(403).json({ message: "Cannot modify request. The parent's ID has not been verified yet." });
        }

        if (requestDetails.requires_payment && !requestDetails.payment_verified) {
            return res.status(403).json({ message: 'Cannot modify request. The payment has not been verified yet.' });
        }

        const { delivery_method } = requestDetails;

        // Determine if we should update status to 'issued'
        let updatedStatusQuery = '';
        if (delivery_method === 'emailed') {
            updatedStatusQuery = ", status = 'issued'";
        }

        const result = await db.query(
            `UPDATE document_requests 
             SET generated_file_path = $1${updatedStatusQuery} 
             WHERE request_id = $2 
             RETURNING *`,
            [docPath, id]
        );

        res.json({
            message: delivery_method === 'emailed' 
                ? 'Document uploaded and request marked as issued successfully.'
                : 'Document uploaded successfully.',
            request: result.rows[0],
            generated_file_path: docPath
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during document upload.' });
    }
};

const getVerifications = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                dr.request_id as id,
                p.full_name as name,
                p.email,
                dr.request_date as created_at,
                dr.id_image_path,
                CASE WHEN dr.id_verified = TRUE THEN 'approved' ELSE 'pending' END as status,
                dt.name as doc_type
            FROM document_requests dr
            JOIN parents p ON dr.parent_id = p.parent_id
            JOIN document_types dt ON dr.document_type_id = dt.document_type_id
            WHERE dr.id_image_path IS NOT NULL
            ORDER BY dr.request_date DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching verifications.' });
    }
};

const updateVerification = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Valid status (approved or rejected) is required.' });
        }

        if (status === 'approved') {
            const reqRes = await db.query(
                `SELECT dr.*, dt.requires_payment, p.parent_id
                 FROM document_requests dr
                 JOIN document_types dt ON dr.document_type_id = dt.document_type_id
                 JOIN parents p ON dr.parent_id = p.parent_id
                 WHERE dr.request_id = $1`,
                [id]
            );
            if (reqRes.rows.length === 0) return res.status(404).json({ message: 'Request not found.' });
            const requestDetails = reqRes.rows[0];

            let newStatus = 'pending';
            if (requestDetails.requires_payment) {
                const payRes = await db.query('SELECT verified FROM payments WHERE request_id = $1', [id]);
                if (payRes.rows.length > 0 && payRes.rows[0].verified) {
                    newStatus = 'processing';
                }
            } else {
                newStatus = 'processing';
            }

            await db.query(
                'UPDATE document_requests SET id_verified = TRUE, status = $1 WHERE request_id = $2',
                [newStatus, id]
            );

            await db.query(
                `INSERT INTO notifications (parent_id, title, message) VALUES ($1, $2, $3)`,
                [requestDetails.parent_id, 'Request ID Verified', `Your ID verification for request BM-${id} has been approved.`]
            );
        } else {
            const reqRes = await db.query('SELECT parent_id FROM document_requests WHERE request_id = $1', [id]);
            if (reqRes.rows.length === 0) return res.status(404).json({ message: 'Request not found.' });
            const parentId = reqRes.rows[0].parent_id;

            await db.query(
                "UPDATE document_requests SET id_verified = FALSE, status = 'denied' WHERE request_id = $1",
                [id]
            );

            await db.query(
                `INSERT INTO notifications (parent_id, title, message) VALUES ($1, $2, $3)`,
                [parentId, 'Request ID Verification Rejected', `Your ID verification for request BM-${id} was rejected.`]
            );
        }

        res.json({ message: `Verification status updated to ${status} successfully.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating verification.' });
    }
};

module.exports = { 
    getProfile, 
    updateProfile, 
    uploadProfilePicture, 
    getAllRequests, 
    getRequestById, 
    verifyParent, 
    verifyPayment, 
    updateRequestStatus, 
    updateRequestStatusById,
    getStats,
    getUrgentQueue,
    getPayments,
    verifyPaymentById,
    uploadDocument,
    getVerifications,
    updateVerification
};
