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

// GET /api/auth/validate (protected) — used to check if token is still valid
router.get("/validate", protect, (req, res) => {
  res.json({ success: true, message: "Token is valid", user_id: req.user._id });
});

router.get("/test-email", async (req, res) => {
  try {
    const { sendOTPEmail } = require("../services/emailService");
    await sendOTPEmail("lalitsharma63786@gmail.com", "999999");
    res.json({ success: true, message: "Test email sent" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
module.exports = router;
