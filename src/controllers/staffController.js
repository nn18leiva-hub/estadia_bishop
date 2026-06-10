const db = require('../config/db');

const getAllRequests = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                dr.*, 
                p.full_name as parent_name, 
                p.email as parent_email, 
                p.verified as parent_verified, 
                p.ssn_card_image_path,
                dt.name as document_type_name,
                dt.requires_payment,
                pmt.payment_id,
                pmt.receipt_image_path,
                pmt.verified as payment_verified
            FROM document_requests dr
            JOIN parents p ON dr.parent_id = p.parent_id
            JOIN document_types dt ON dr.document_type_id = dt.document_type_id
            LEFT JOIN payments pmt ON dr.request_id = pmt.request_id
            ORDER BY dr.request_date DESC
        `);
        res.json(result.rows);
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
                p.verified as parent_verified, 
                p.ssn_card_image_path,
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
        res.json(result.rows[0]);
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

module.exports = { getAllRequests, getRequestById, verifyParent, verifyPayment, updateRequestStatus };
