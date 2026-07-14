const db = require('../config/db');
const { sendNotificationEmail } = require('./emailService');

/**
 * Creates an in-app notification in the database and triggers a styled email notification.
 * 
 * @param {number} parentId The ID of the parent to notify
 * @param {string} title The notification title
 * @param {string} message The notification message body
 */
const createNotification = async (parentId, title, message) => {
    try {
        // 1. Insert notification into the database
        const dbRes = await db.query(
            'INSERT INTO notifications (parent_id, title, message) VALUES ($1, $2, $3) RETURNING *',
            [parentId, title, message]
        );

        // 2. Fetch the parent's email address
        const parentRes = await db.query('SELECT email FROM parents WHERE parent_id = $1', [parentId]);
        if (parentRes.rows.length > 0) {
            const email = parentRes.rows[0].email;
            
            // 3. Send email notification (asynchronously to avoid blocking request response)
            sendNotificationEmail(email, title, message).catch(err => {
                console.error(`❌ Failed to send notification email to ${email}:`, err);
            });
        }

        return dbRes.rows[0];
    } catch (err) {
        console.error('❌ Error creating notification:', err);
        throw err;
    }
};

module.exports = { createNotification };
