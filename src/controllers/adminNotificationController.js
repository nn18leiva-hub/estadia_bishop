const db = require('../config/db');
const notificationService = require('../services/notificationService');

/**
 * Get all notification templates.
 */
async function getTemplates(req, res) {
    try {
        const result = await db.query('SELECT * FROM notification_templates ORDER BY template_id ASC');
        return res.json({ success: true, templates: result.rows });
    } catch (err) {
        console.error('Error fetching notification templates:', err);
        return res.status(500).json({ success: false, message: 'Failed to load templates' });
    }
}

/**
 * Update a notification template's title and message.
 */
async function updateTemplate(req, res) {
    try {
        const { id } = req.params;
        const { title_template, message_template, is_active } = req.body;

        if (!title_template || !message_template) {
            return res.status(400).json({ success: false, message: 'Title and message templates are required' });
        }

        const result = await db.query(
            `UPDATE notification_templates
             SET title_template = $1, message_template = $2, is_active = COALESCE($3, is_active), updated_at = CURRENT_TIMESTAMP
             WHERE template_id = $4 RETURNING *`,
            [title_template, message_template, is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }

        return res.json({ success: true, template: result.rows[0] });
    } catch (err) {
        console.error('Error updating notification template:', err);
        return res.status(500).json({ success: false, message: 'Failed to update template' });
    }
}

/**
 * Get all notification settings.
 */
async function getSettings(req, res) {
    try {
        const result = await db.query('SELECT * FROM notification_settings ORDER BY setting_id ASC');
        return res.json({ success: true, settings: result.rows });
    } catch (err) {
        console.error('Error fetching notification settings:', err);
        return res.status(500).json({ success: false, message: 'Failed to load notification settings' });
    }
}

/**
 * Update notification settings (channel toggles, gateway API keys).
 */
async function updateSettings(req, res) {
    try {
        const { settings } = req.body; // Array of { key, value }
        if (!Array.isArray(settings)) {
            return res.status(400).json({ success: false, message: 'Invalid payload format. Expected settings array.' });
        }

        for (const item of settings) {
            await db.query(
                `INSERT INTO notification_settings (setting_key, setting_value, updated_at)
                 VALUES ($1, $2, CURRENT_TIMESTAMP)
                 ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP`,
                [item.key, String(item.value)]
            );
        }

        const updated = await db.query('SELECT * FROM notification_settings ORDER BY setting_id ASC');
        return res.json({ success: true, settings: updated.rows });
    } catch (err) {
        console.error('Error updating notification settings:', err);
        return res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
}

/**
 * Broadcast a direct announcement notification to all parents or a specific target.
 */
async function broadcastNotification(req, res) {
    try {
        const { title, message, target_parent_id } = req.body;
        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'Title and message are required for broadcast' });
        }

        let sentCount = 0;

        if (target_parent_id) {
            await notificationService.createNotification(target_parent_id, title, message);
            sentCount = 1;
        } else {
            // Broadcast to all parents
            const parents = await db.query('SELECT parent_id FROM parents');
            for (const p of parents.rows) {
                await notificationService.createNotification(p.parent_id, title, message);
                sentCount++;
            }
        }

        return res.json({ success: true, message: `Notification dispatched successfully to ${sentCount} account(s).`, sentCount });
    } catch (err) {
        console.error('Error broadcasting notification:', err);
        return res.status(500).json({ success: false, message: 'Failed to dispatch broadcast' });
    }
}

/**
 * Get sent notification audit logs.
 */
async function getNotificationLogs(req, res) {
    try {
        const result = await db.query(
            `SELECT n.notification_id, n.title, n.message, n.read, n.created_at, p.full_name as parent_name, p.email as parent_email
             FROM notifications n
             LEFT JOIN parents p ON n.parent_id = p.parent_id
             ORDER BY n.created_at DESC LIMIT 100`
        );
        return res.json({ success: true, logs: result.rows });
    } catch (err) {
        console.error('Error fetching notification logs:', err);
        return res.status(500).json({ success: false, message: 'Failed to load logs' });
    }
}

module.exports = {
    getTemplates,
    updateTemplate,
    getSettings,
    updateSettings,
    broadcastNotification,
    getNotificationLogs,
};
