const db = require('../config/db');

const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image.' });
        }

        const imagePath = `uploads/profile_pictures/${req.file.filename}`;

        await db.query(
            'UPDATE parents SET profile_picture_path = $1 WHERE parent_id = $2',
            [imagePath, req.user.id]
        );

        res.json({ message: 'Profile picture updated successfully.', profile_picture_path: imagePath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during profile picture upload.' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { full_name, phone } = req.body;

        if (!full_name) return res.status(400).json({ message: 'full_name is required.' });

        const result = await db.query(
            'UPDATE parents SET full_name = $1, phone = $2 WHERE parent_id = $3 RETURNING parent_id, full_name, email, phone, profile_picture_path, verified, user_type, created_at',
            [full_name, phone || null, req.user.id]
        );

        res.json({ message: 'Profile updated successfully.', user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating profile.' });
    }
};

const getProfile = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT parent_id, full_name, email, phone, profile_picture_path, verified, user_type, created_at FROM parents WHERE parent_id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Parent not found.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
};

const getNotifications = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM notifications WHERE parent_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching notifications.' });
    }
};

const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            'UPDATE notifications SET read = TRUE WHERE notification_id = $1 AND parent_id = $2 RETURNING *',
            [id, req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Notification not found.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error marking notification as read.' });
    }
};

const markAllNotificationsRead = async (req, res) => {
    try {
        await db.query(
            'UPDATE notifications SET read = TRUE WHERE parent_id = $1',
            [req.user.id]
        );
        res.json({ message: 'All notifications marked as read.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error marking all notifications as read.' });
    }
};

module.exports = { 
    uploadProfilePicture, 
    updateProfile, 
    getProfile,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead
};
