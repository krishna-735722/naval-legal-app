const nodemailer = require("nodemailer");

/**
 * EMAIL SERVICE
 * - Local dev  → uses Gmail directly (works fine)
 * - Production → uses Brevo SMTP relay (Render blocks direct Gmail)
 *
 * .env for LOCAL:
 *   NODE_ENV=development
 *   EMAIL_USER=you@gmail.com
 *   EMAIL_PASS=your_gmail_app_password
 *   EMAIL_FROM=Naval Legal Companion <you@gmail.com>
 *
 * .env for RENDER (production):
 *   NODE_ENV=production
 *   EMAIL_HOST=smtp-relay.brevo.com
 *   EMAIL_PORT=587
 *   EMAIL_USER=your_brevo_login_email
 *   EMAIL_PASS=your_brevo_smtp_key
 *   EMAIL_FROM=Naval Legal Companion <your_brevo_verified_sender>
 */

const buildTransporter = () => {
  if (process.env.NODE_ENV === "production") {
    // ── Brevo relay for cloud hosting ──────────────────────────
    console.log("📧 Email: using Brevo SMTP relay");
    return nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
  } else {
    // ── Gmail direct for local dev ──────────────────────────────
    console.log("📧 Email: using Gmail direct");
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
    });
  }
};

// Build once at startup — don't recreate on every request
const transporter = buildTransporter();

// Verify connection at startup so you know immediately if config is wrong
transporter.verify((error) => {
  if (error) {
    console.error("❌ Email transporter failed to connect:", error.message);
  } else {
    console.log("✅ Email transporter ready");
  }
});

const sendOTPEmail = async (email, otp) => {
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