const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { sendOtp, verifyOtp, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// Rate limiter for OTP — prevent spam
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { success: false, message: "Too many OTP requests. Please wait 15 minutes." },
});

// POST /api/auth/send-otp
router.post("/send-otp", otpLimiter, sendOtp);

// POST /api/auth/verify-otp
router.post("/verify-otp", verifyOtp);

// GET /api/auth/me   (protected)
router.get("/me", protect, getMe);

module.exports = router;
