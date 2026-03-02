const express = require("express");
const router = express.Router();
const {
  startSession,
  respondToSession,
  getSessionStatus,
  saveCharge,
  getSavedCharges,
} = require("../controllers/sessionController");
const { protect, optionalAuth } = require("../middleware/auth");

// POST /api/sessions/start         — anyone can start (auth optional)
router.post("/start", optionalAuth, startSession);

// POST /api/sessions/:id/respond   — anyone can respond (auth optional)
router.post("/:session_id/respond", optionalAuth, respondToSession);

// GET  /api/sessions/:id/status    — get current session state
router.get("/:session_id/status", getSessionStatus);

// POST /api/sessions/:id/save      — save charge to profile (auth required)
router.post("/:session_id/save", protect, saveCharge);

// GET  /api/sessions/saved         — get all saved charges (auth required)
router.get("/saved/list", protect, getSavedCharges);

module.exports = router;
