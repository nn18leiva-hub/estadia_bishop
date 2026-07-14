const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const { sendPasswordResetEmail, sendProfileVerificationCode } = require('../services/emailService');
require('dotenv').config();

const registerParent = async (req, res) => {
    try {
        const { full_name, email, phone, password, user_type, dob } = req.body;
        
        if (!full_name || !email || !password) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        const type = user_type || 'parent';
        if (!['parent', 'past_student'].includes(type)) {
            return res.status(400).json({ message: 'Invalid user_type. Must be parent or past_student.' });
        }

        if (!dob) {
            return res.status(400).json({ message: 'Date of birth (dob) is required to register for all users.' });
        }

        if (type === 'past_student') {
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            if (age < 18) {
                return res.status(403).json({ message: 'Past students must be 18 years or older to register.' });
            }
        }

        const emailCheck = await db.query('SELECT parent_id FROM parents WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Email already registered.' });
        }

        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        const newParent = await db.query(
            'INSERT INTO parents (full_name, email, phone, password_hash, user_type, dob) VALUES ($1, $2, $3, $4, $5, $6) RETURNING parent_id, full_name, email, user_type',
            [full_name, email, phone, password_hash, type, type === 'past_student' ? dob : null]
        );

        res.status(201).json({ message: 'User registered successfully.', user: newParent.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        let result = await db.query('SELECT * FROM staff WHERE email = $1', [email]);
        let user = result.rows[0];
        let userType = 'staff';
        
        if (!user) {
            result = await db.query('SELECT * FROM parents WHERE email = $1', [email]);
            user = result.rows[0];
            userType = 'parent';
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const payload = {
            id: userType === 'parent' ? user.parent_id : user.staff_id,
            email: user.email,
            type: userType === 'parent' ? user.user_type : userType,
            role: userType === 'staff' ? user.role : undefined
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
        const finalType = userType === 'parent' ? user.user_type : userType;

        // Track activity: update last_activity timestamp
        const activityTable = userType === 'parent' ? 'parents' : 'staff';
        const activityIdCol = userType === 'parent' ? 'parent_id' : 'staff_id';
        db.query(`UPDATE ${activityTable} SET last_activity = NOW() WHERE ${activityIdCol} = $1`, [payload.id])
          .catch(err => console.error('Failed to update activity:', err));

        res.json({ message: 'Login successful', token, type: finalType, id: payload.id, role: payload.role });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during login.' });
    }
};
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required.' });

        // Verify if email exists in either table
        let userCheck = await db.query('SELECT email FROM parents WHERE email = $1', [email]);
        if (userCheck.rows.length === 0) {
            userCheck = await db.query('SELECT email FROM staff WHERE email = $1', [email]);
        }

        // Always return success even if email doesn't exist to prevent email scraping
        if (userCheck.rows.length === 0) {
            return res.json({ message: 'If that email exists in our system, a verification code has been sent.' });
        }

        // Generate a 6-digit random number as a string securely
        const min = 100000;
        const max = 999999;
        const resetCode = crypto.randomInt(min, max + 1).toString();
        
        // Expiration: 15 minutes from now
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        // Store in DB
        await db.query(
            'INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)',
            [email, resetCode, expiresAt]
        );

        // Send Email
        const emailSent = await sendPasswordResetEmail(email, resetCode);
        if (!emailSent) {
            return res.status(500).json({ message: 'Failed to dispatch email service.' });
        }

        res.json({ message: 'If that email exists in our system, a verification code has been sent.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error processing password reset request.' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;
        if (!email || !token || !newPassword) {
            return res.status(400).json({ message: 'Email, code, and new password are required.' });
        }

        // Retrieve valid token for this specific email
        const tokenRes = await db.query(
            'SELECT email FROM password_resets WHERE email = $1 AND token = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [email, token]
        );

        if (tokenRes.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired verification code.' });
        }

        const password_hash = await bcrypt.hash(newPassword, 10);

        // Update the password in parents table OR staff table
        const parentUpdate = await db.query('UPDATE parents SET password_hash = $1 WHERE email = $2 RETURNING parent_id', [password_hash, email]);
        
        if (parentUpdate.rows.length === 0) {
            await db.query('UPDATE staff SET password_hash = $1 WHERE email = $2', [password_hash, email]);
        }

        // Consume the token (flush all tokens for this email to prevent reuse)
        await db.query('DELETE FROM password_resets WHERE email = $1', [email]);

        res.json({ message: 'Password has been successfully reset. You may now login.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error attempting to reset password.' });
    }
};

const requestProfileCode = async (req, res) => {
    try {
        const { email } = req.user; // from authMiddleware
        if (!email) return res.status(400).json({ message: 'Unauthorized request.' });

        // Generate a 6-digit random number as a string securely
        const min = 100000;
        const max = 999999;
        const code = crypto.randomInt(min, max + 1).toString();

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Short expiry

        // Store in DB
        await db.query(
            'INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)',
            [email, code, expiresAt]
        );

        // Send Email
        const emailSent = await sendProfileVerificationCode(email, code);
        if (!emailSent) {
            return res.status(500).json({ message: 'Failed to dispatch email service.' });
        }

        res.json({ message: 'Verification code sent to your email.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error processing code request.' });
    }
};

const changeProfilePassword = async (req, res) => {
    try {
        const { email } = req.user;
        const { code, newPassword } = req.body;
        
        if (!email) return res.status(400).json({ message: 'Unauthorized request.' });
        if (!code || !newPassword) return res.status(400).json({ message: 'Code and new password required.' });

        // Retrieve valid token
        const tokenRes = await db.query(
            'SELECT email FROM password_resets WHERE email = $1 AND token = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [email, code]
        );

        if (tokenRes.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired verification code.' });
        }

        const password_hash = await bcrypt.hash(newPassword, 10);

        // Try parent first
        const parentUpdate = await db.query('UPDATE parents SET password_hash = $1 WHERE email = $2 RETURNING parent_id', [password_hash, email]);
        
        if (parentUpdate.rows.length === 0) {
            // Then staff
            await db.query('UPDATE staff SET password_hash = $1 WHERE email = $2', [password_hash, email]);
        }

        // Consume all tokens for this email
        await db.query('DELETE FROM password_resets WHERE email = $1', [email]);

        res.json({ message: 'Your password has been successfully updated.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error attempting to change password.' });
    }
};

module.exports = { registerParent, login, forgotPassword, resetPassword, requestProfileCode, changeProfilePassword };
