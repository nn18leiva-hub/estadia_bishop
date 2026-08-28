const db = require('../config/db');
const { sendNotificationEmail } = require('./emailService');
const { sendWhatsAppNotification } = require('./whatsappService');

/**
 * Helper to fetch a global notification setting from the database.
 */
const getSetting = async (key, defaultValue = '') => {
    try {
        const res = await db.query('SELECT setting_value FROM notification_settings WHERE setting_key = $1', [key]);
        if (res.rows.length > 0 && res.rows[0].setting_value !== null) {
            return res.rows[0].setting_value;
        }
    } catch (err) {
        console.warn(`[NotificationService] Setting fallback for ${key}:`, err.message);
    }
    return defaultValue;
};

/**
 * Helper to fetch a notification template by event_key.
 */
const getTemplate = async (eventKey) => {
    try {
        const res = await db.query('SELECT * FROM notification_templates WHERE event_key = $1 AND is_active = TRUE', [eventKey]);
        if (res.rows.length > 0) {
            return res.rows[0];
        }
    } catch (err) {
        console.warn(`[NotificationService] Template lookup fallback for ${eventKey}:`, err.message);
    }
    return null;
};

/**
 * Replaces dynamic placeholder tags like {student_name}, {document_name}, {status}, {parent_name}, {request_id}
 */
const formatTemplate = (templateStr = '', data = {}) => {
    if (!templateStr) return '';
    let result = templateStr;
    const replacements = {
        '{student_name}': data.student_name || data.student_full_name || 'Student',
        '{document_name}': data.document_name || data.docLabel || 'Document',
        '{status}': data.status || 'Updated',
        '{parent_name}': data.parent_name || data.full_name || 'Parent',
        '{request_id}': data.request_id ? `#${data.request_id}` : '',
        '{notes}': data.notes || data.staff_notes || ''
    };

    Object.keys(replacements).forEach(tag => {
        const regex = new RegExp(tag.replace(/[{}]/g, '\\$&'), 'gi');
        result = result.replace(regex, replacements[tag]);
    });
    return result.trim();
};

/**
 * Creates an in-app notification in the database and triggers email/WhatsApp.
 */
const createNotification = async (parentId, title, message) => {
    try {
        // 1. Insert notification into the database
        const dbRes = await db.query(
            'INSERT INTO notifications (parent_id, title, message) VALUES ($1, $2, $3) RETURNING *',
            [parentId, title, message]
        );

        // 2. Fetch global channel toggles
        const emailEnabled = (await getSetting('auto_email_enabled', 'true')) === 'true';
        const whatsappEnabled = (await getSetting('auto_whatsapp_enabled', 'true')) === 'true';

        // 3. Fetch the parent's contact details & notification preferences
        const parentRes = await db.query(
            'SELECT full_name, email, phone, whatsapp_number, notification_channel, signup_method FROM parents WHERE parent_id = $1',
            [parentId]
        );

        if (parentRes.rows.length > 0) {
            const parent = parentRes.rows[0];
            const channel = parent.notification_channel || parent.signup_method || 'email';
            const email = parent.email;
            const whatsappNum = parent.whatsapp_number || parent.phone;

            // Send Email if enabled and preference is 'email' or 'both'
            if (emailEnabled && (channel === 'email' || channel === 'both') && email) {
                sendNotificationEmail(email, title, message).catch(err => {
                    console.error(`❌ Failed to send notification email to ${email}:`, err);
                });
            }

            // Send WhatsApp if enabled and preference is 'whatsapp' or 'both'
            if (whatsappEnabled && (channel === 'whatsapp' || channel === 'both') && whatsappNum) {
                sendWhatsAppNotification(whatsappNum, title, message).catch(err => {
                    console.error(`❌ Failed to send WhatsApp notification to ${whatsappNum}:`, err);
                });
            }
        }

        return dbRes.rows[0];
    } catch (err) {
        console.error('❌ Error creating notification:', err);
        throw err;
    }
};

/**
 * High-level helper that formats title & message from a template before sending.
 */
const createFormattedNotification = async (parentId, eventKey, data = {}, fallbackTitle = '', fallbackMessage = '') => {
    const template = await getTemplate(eventKey);
    let title = fallbackTitle;
    let message = fallbackMessage;

    if (template) {
        title = formatTemplate(template.title_template, data);
        message = formatTemplate(template.message_template, data);
    } else {
        title = formatTemplate(fallbackTitle, data);
        message = formatTemplate(fallbackMessage, data);
    }

    return await createNotification(parentId, title, message);
};

module.exports = {
    createNotification,
    createFormattedNotification,
    getSetting,
    getTemplate,
    formatTemplate,
};
