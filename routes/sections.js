const express = require("express");
const router = express.Router();
const {
  lookupSection,
  getSectionById,
  getAllSections,
} = require("../controllers/sectionController");

// POST /api/sections/lookup  — smart search
router.post("/lookup", lookupSection);

// GET  /api/sections          — list all with filters
router.get("/", getAllSections);

// GET  /api/sections/:id      — full section detail
router.get("/:id", getSectionById);

module.exports = router;
