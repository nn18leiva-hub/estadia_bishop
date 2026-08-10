/**
 * Shared utility: maps raw DB document_request rows to the key shape
 * expected by the frontend (consistent across staff and parent contexts).
 */
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

module.exports = { mapRequestKeys };
