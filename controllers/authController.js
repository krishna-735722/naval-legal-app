const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendOTPEmail } = require("../services/emailService");

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * POST /api/auth/send-otp
 * Body: { email }
 * Creates user if not exists, sends OTP email.
 */
const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Valid email is required" });
    }

    let otp;

    // CHECK: If MOCK_OTP is true in .env, use hardcoded 123456
    if (process.env.MOCK_OTP === 'true') {
      otp = "123456";
      console.log("⚠️ MOCK OTP MODE ACTIVE: OTP is 123456");
    } else {
      otp = generateOTP();
    }

    const expiresAt = new Date(
      Date.now() + (parseInt(process.env.OTP_EXPIRES_MINUTES) || 10) * 60 * 1000
    );

    // Upsert user — create if not exists
    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { otp: { code: otp, expiresAt } },
      { upsert: true, new: true }
    );

    // Attempt to send email (or skip if in Mock Mode)
    await sendOTPEmail(email, otp);

    res.json({
      success: true,
      message: `OTP sent to ${email}. Valid for ${process.env.OTP_EXPIRES_MINUTES || 10} minutes.`,
    });
  } catch (error) {
    console.error("sendOtp error:", error.message);
    res.status(500).json({ success: false, message: "Failed to send OTP. Try again." });
  }
};

/**
 * POST /api/auth/verify-otp
 * Body: { email, otp }
 * Verifies OTP and returns JWT token.
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found. Please request OTP first." });
    }

    if (!user.otp || !user.otp.code) {
      return res.status(400).json({ success: false, message: "No OTP found. Please request a new one." });
    }

    if (new Date() > user.otp.expiresAt) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    if (user.otp.code !== otp.toString()) {
      return res.status(400).json({ success: false, message: "Incorrect OTP." });
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("verifyOtp error:", error.message);
    res.status(500).json({ success: false, message: "Verification failed. Try again." });
  }
};

/**
 * GET /api/auth/me
 * Returns logged-in user profile.
 */
const getMe = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      email: req.user.email,
      lastLogin: req.user.lastLogin,
      savedChargesCount: req.user.savedCharges?.length || 0,
    },
  });
};

module.exports = { sendOtp, verifyOtp, getMe };