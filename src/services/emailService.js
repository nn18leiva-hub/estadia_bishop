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

/**
 * Sends a styled notification email to the parent.
 */
const sendNotificationEmail = async (userEmail, title, message) => {
    if (!transporter) await initEmailService();

    const fromAddress = process.env.SMTP_FROM || '"Bishop Martin IT Dept" <no-reply@bmhs.edu.bz>';
    const mailOptions = {
        from: fromAddress,
        to: userEmail,
        subject: `🔔 BMHS Portal Notification: ${title}`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
                    <h1 style="color: #800000; font-size: 24px; margin: 0; font-weight: 700;">Bishop Martin High School</h1>
                    <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Academic Document Request Portal</p>
                </div>
                
                <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 12px;">${title}</h3>
                <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">${message}</p>
                
                <div style="text-align: center; margin-bottom: 24px;">
                    <a href="http://localhost:3000/login.html" style="background-color: #800000; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 15px; box-shadow: 0 2px 4px rgba(128,0,0,0.2);">
                        Go to Portal
                    </a>
                </div>
                
                <p style="color: #94a3b8; font-size: 12px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px; margin: 0;">
                    This is an automated notification from Bishop Martin Administration. Please do not reply directly to this email.
                </p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("-----------------------------------------");
        console.log("Notification Email sent to: %s", info.messageId);
        if (!process.env.SMTP_HOST) {
            console.log("🔗 PREVIEW EMAIL URL: %s", nodemailer.getTestMessageUrl(info));
        }
        console.log("-----------------------------------------");
        return true;
    } catch (error) {
        console.error("Error sending notification email: ", error);
        return false;
    }
};

module.exports = { 
    initEmailService, 
    sendPasswordResetEmail, 
    sendProfileVerificationCode,
    sendNotificationEmail 
};
