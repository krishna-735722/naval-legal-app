const nodemailer = require("nodemailer");

// Works on Render, Railway, any cloud host
// Uses Brevo (smtp-relay.brevo.com) — 300 free emails/day
// Set these in your .env / Render environment variables:
//   EMAIL_HOST=smtp-relay.brevo.com
//   EMAIL_PORT=587
//   EMAIL_USER=your_brevo_account_email
//   EMAIL_PASS=your_brevo_smtp_key
//   EMAIL_FROM=Naval Legal Companion <your_brevo_account_email>

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // TLS, not SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,  // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

const sendOTPEmail = async (email, otp) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Naval Legal Companion — Your OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #0a1f44; padding: 24px; text-align: center;">
          <h2 style="color: #c9a84c; margin: 0;">⚓ Naval Legal Companion</h2>
          <p style="color: #ffffff; margin: 8px 0 0;">Your Smart Guide to Naval Law</p>
        </div>
        <div style="padding: 32px; text-align: center;">
          <p style="font-size: 16px; color: #333;">Your One-Time Password (OTP) is:</p>
          <div style="background: #f4f4f4; border-radius: 8px; padding: 20px; margin: 16px 0;">
            <span style="font-size: 36px; font-weight: bold; color: #0a1f44; letter-spacing: 8px;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #888;">This OTP is valid for <strong>${process.env.OTP_EXPIRES_MINUTES || 10} minutes</strong>.</p>
          <p style="font-size: 14px; color: #888;">If you did not request this, please ignore this email.</p>
        </div>
        <div style="background: #f9f9f9; padding: 16px; text-align: center; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 12px; color: #aaa; margin: 0;">Naval Legal Companion — For Indian Navy Use</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };