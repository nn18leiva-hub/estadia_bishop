const nodemailer = require('nodemailer');

let transporter;

/**
 * Initializes the Ethereal Email SMTP service for development testing.
 * Do not use Ethereal in production.
 */
const initEmailService = async () => {
    try {
        if (process.env.SMTP_HOST) {
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587', 10),
                secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
            console.log('✅ Real SMTP Email Service initialized.');
        } else {
            // Generate a fake testing account
            const testAccount = await nodemailer.createTestAccount();

            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: testAccount.user, // generated ethereal user
                    pass: testAccount.pass, // generated ethereal password
                },
            });
            console.log('✅ Ethereal Email Service initialized for Development.');
        }
    } catch (err) {
        console.error('❌ Failed to initialize Email Service:', err);
    }
};

/**
 * Sends a password reset email containing the 6-digit verification code
 */
const sendPasswordResetEmail = async (userEmail, resetCode) => {
    if (!transporter) await initEmailService();

    const fromAddress = process.env.SMTP_FROM || '"Bishop Martin IT Dept" <no-reply@bmhs.edu.bz>';
    const mailOptions = {
        from: fromAddress,
        to: userEmail,
        subject: "🔒 BMHS Portal Password Reset Verification Code",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #4f46e5;">Password Reset Code</h2>
                <p>Hello,</p>
                <p>We received a request to reset the password for your Bishop Martin Portal account.</p>
                <p>To authorize this action, please enter the following 6-digit authorization code on your screen. This code will expire in 15 minutes.</p>
                <div style="text-align: center; margin: 30px 0; background-color: #f1f5f9; padding: 20px; border-radius: 8px; border: 1px dashed #cbd5e1;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b;">${resetCode}</span>
                </div>
                <p style="color: #64748b; font-size: 14px;">If you did not request this, you may safely ignore this email.</p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("-----------------------------------------");
        console.log("Password Reset Code sent to: %s", info.messageId);
        if (!process.env.SMTP_HOST) {
            // Ethereal provides a URL to visibly SEE the generated email in browser
            console.log("🔗 PREVIEW EMAIL URL: %s", nodemailer.getTestMessageUrl(info));
        }
        console.log("-----------------------------------------");
        return true;
    } catch (error) {
        console.error("Error sending email: ", error);
        return false;
    }
};

const sendProfileVerificationCode = async (userEmail, sixDigitCode) => {
    if (!transporter) await initEmailService();

    const fromAddress = process.env.SMTP_FROM || '"Bishop Martin IT Dept" <no-reply@bmhs.edu.bz>';
    const mailOptions = {
        from: fromAddress,
        to: userEmail,
        subject: "🔑 BMHS Portal Profile Verification Code",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #4f46e5;">Profile Security Verification</h2>
                <p>Hello,</p>
                <p>We received a request to update the secure credentials for your Bishop Martin Portal account.</p>
                <p>To authorize this action, please enter the following 6-digit authorization code on your screen. This code will expire in 15 minutes.</p>
                <div style="text-align: center; margin: 30px 0; background-color: #f1f5f9; padding: 20px; border-radius: 8px; border: 1px dashed #cbd5e1;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b;">${sixDigitCode}</span>
                </div>
                <p style="color: #64748b; font-size: 14px;">If you did not initiate this request from your Account Settings, please consider your password safe, but you may want to monitor your account.</p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("-----------------------------------------");
        console.log("Verification Code sent to: %s", info.messageId);
        if (!process.env.SMTP_HOST) {
            console.log("🔗 PREVIEW EMAIL URL: %s", nodemailer.getTestMessageUrl(info));
        }
        console.log("-----------------------------------------");
        return true;
    } catch (error) {
        console.error("Error sending email: ", error);
        return false;
    }
};

module.exports = { initEmailService, sendPasswordResetEmail, sendProfileVerificationCode };
