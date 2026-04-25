const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

/**
 * Notification Service
 * Handles sending emails and (future) SMS notifications.
 */

let transporter;

// Initialize transporter with SMTP settings from .env
const initTransporter = () => {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        console.log('Nodemailer: Initialized with SMTP settings.');
    } else {
        // Fallback to Ethereal for development if no real credentials provided
        nodemailer.createTestAccount((err, account) => {
            if (err) {
                console.error('Failed to create a testing account. ' + err.message);
                return;
            }
            transporter = nodemailer.createTransport({
                host: account.smtp.host,
                port: account.smtp.port,
                secure: account.smtp.secure,
                auth: { user: account.user, pass: account.pass }
            });
            console.log('Nodemailer: Created Ethereal test account for development.');
        });
    }
};

initTransporter();

/**
 * Send OTP via Email
 * @param {string} email - Recipient email address
 * @param {string} otp - The 6-digit OTP
 */
const sendOTPEmail = async (email, otp) => {
    if (!transporter) {
        // Retry initialization once if it hasn't happened
        initTransporter();
        if (!transporter) throw new Error('Email transporter not initialized');
    }

    const mailOptions = {
        from: `"RapidCare Support" <${process.env.SMTP_USER || 'no-reply@rapidcare.com'}>`,
        to: email,
        subject: 'Your RapidCare Verification Code',
        text: `Your RapidCare verification code is: ${otp}. This code expires in 10 minutes.`,
        html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #ff3b30; margin: 0; font-size: 28px; letter-spacing: 1px;">RapidCare</h1>
                <p style="color: #666; font-size: 14px; margin-top: 5px;">Emergency Response & Medical Coordination</p>
            </div>
            <div style="background: linear-gradient(135deg, #ff3b30 0%, #ff7a5c 100%); padding: 30px; border-radius: 10px; text-align: center; color: white; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 16px; opacity: 0.9;">Verification Code</p>
                <h2 style="margin: 10px 0; font-size: 42px; font-weight: 800; letter-spacing: 8px;">${otp}</h2>
                <p style="margin: 0; font-size: 14px; opacity: 0.8;">Expires in 10 minutes</p>
            </div>
            <div style="color: #333; line-height: 1.6; font-size: 16px;">
                <p>Hello,</p>
                <p>You requested a verification code to access your RapidCare account. Please enter the code above to continue.</p>
                <p style="font-size: 14px; color: #777; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                    If you did not request this code, please ignore this email or contact our support team if you have concerns about your account security.
                </p>
            </div>
            <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #999;">
                <p>&copy; 2026 RapidCare Technologies. All rights reserved.</p>
            </div>
        </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        if (!process.env.SMTP_HOST) {
            console.log(`[Nodemailer Preview] ${nodemailer.getTestMessageUrl(info)}`);
        }
        return info;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw error;
    }
};

module.exports = {
    sendOTPEmail
};
