const db = require('../config/db');
const { generateDocument } = require('../services/pdfGenerator');

// GET /api/requests/document-types — public, no auth needed
const getDocumentTypes = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM document_types ORDER BY document_type_id');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching document types.' });
    }
};

const createRequest = async (req, res) => {
    try {
        const parentId = req.user.id;

        const {
            // Frontend sends these field names:
            document_type_name,   // string key e.g. 'transcript', 'enrollment', 'graduation'
            document_type_id,     // OR numeric ID (direct)
            student_full_name,
            student_graduation_year_or_years_attended,
            delivery_method,      // frontend sends 'digital' | 'physical' | 'pickup' | 'mailed' | 'emailed'
            processing_speed,
            fee,
            notes,
            recipient_email,
            form_data,
        } = req.body;

        const idFile = req.files?.['id_image']?.[0];
        if (!idFile) {
            return res.status(400).json({ message: 'An ID card image upload is required for every request or submission.' });
        }

        const parentResult = await db.query('SELECT * FROM parents WHERE parent_id = $1', [parentId]);
        const parent = parentResult.rows[0];

        if (!parent) {
            return res.status(404).json({ message: 'Parent account not found.' });
        }

        // Resolve document type — by numeric ID or by name key
        let documentType;
        if (document_type_id) {
            const dtResult = await db.query('SELECT * FROM document_types WHERE document_type_id = $1', [document_type_id]);
            if (dtResult.rows.length === 0) return res.status(404).json({ message: 'Invalid document type ID.' });
            documentType = dtResult.rows[0];
        } else if (document_type_name) {
            const dtResult = await db.query('SELECT * FROM document_types WHERE name = $1', [document_type_name]);
            if (dtResult.rows.length === 0) return res.status(404).json({ message: `Document type '${document_type_name}' not found.` });
            documentType = dtResult.rows[0];
        } else {
            return res.status(400).json({ message: 'document_type_id or document_type_name is required.' });
        }

        if (!student_full_name) {
            return res.status(400).json({ message: 'student_full_name is required.' });
        }

        // Normalize delivery method
        let normalizedDelivery;
        if (['emailed', 'mailed', 'pickup'].includes(delivery_method)) {
            normalizedDelivery = delivery_method;
        } else if (delivery_method === 'digital') {
            normalizedDelivery = 'emailed';
        } else if (delivery_method === 'physical') {
            normalizedDelivery = 'pickup';
        } else {
            normalizedDelivery = 'pickup';
        }

        if (parent.user_type === 'past_student' && documentType.name !== 'transcript') {
            return res.status(403).json({ message: 'Past students are only authorized to request transcripts.' });
        }

        const initialStatus = 'pending_verification';
        const alertMessage = 'Request submitted. It is currently pending identity verification.';

        let generated_file_path = null;

        if (documentType.is_auto_generated) {
            const signatureFile = req.files?.['signature_image']?.[0];
            if (!signatureFile) {
                return res.status(400).json({ message: 'A digital signature image upload is required for this form.' });
            }
            generated_file_path = await generateDocument(documentType, parent, req.body, signatureFile);
        }

        const newReq = await db.query(
            `INSERT INTO document_requests
             (parent_id, id_image_path, id_verified, student_full_name, student_graduation_year_or_years_attended,
              document_type_id, form_data, generated_file_path, delivery_method,
              processing_speed, recipient_email, fee, notes, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
            [
                parentId,
                idFile.path,
                false,
                student_full_name,
                student_graduation_year_or_years_attended || null,
                documentType.document_type_id,
                form_data ? (typeof form_data === 'string' ? JSON.parse(form_data) : form_data) : null,
                generated_file_path,
                normalizedDelivery,
                processing_speed || 'standard',
                recipient_email || null,
                fee ? parseFloat(fee) : 0,
                notes || null,
                initialStatus,
            ]
        );

        res.status(201).json({ message: alertMessage, request: newReq.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during request creation.' });
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

const getMyRequests = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT dr.*, dt.name as document_type_name, dt.requires_payment
             FROM document_requests dr
             JOIN document_types dt ON dr.document_type_id = dt.document_type_id
             WHERE dr.parent_id = $1 ORDER BY request_date DESC`,
            [req.user.id]
        );
        res.json(result.rows.map(mapRequestKeys));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching requests.' });
    }
};

const getRequestById = async (req, res) => {
    try {
        const { request_id } = req.params;
        const result = await db.query(
            `SELECT dr.*, dt.name as document_type_name, dt.requires_payment,
                    pmt.payment_id, pmt.verified as payment_verified
             FROM document_requests dr
             JOIN document_types dt ON dr.document_type_id = dt.document_type_id
             LEFT JOIN payments pmt ON dr.request_id = pmt.request_id
             WHERE dr.request_id = $1 AND dr.parent_id = $2`,
            [request_id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Request not found.' });
        }

        res.json(mapRequestKeys(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching request.' });
    }
};

module.exports = { getDocumentTypes, createRequest, getMyRequests, getRequestById };
