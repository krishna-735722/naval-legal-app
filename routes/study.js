const express = require("express");
const router = express.Router();
const {
  getStudySections,
  getStudySectionById,
  getFlashcards,
} = require("../controllers/studyController");

// GET /api/study/sections          — all sections for study mode
router.get("/sections", getStudySections);

// GET /api/study/flashcards        — flashcard format
router.get("/flashcards", getFlashcards);

// GET /api/study/sections/:id      — single section detail
router.get("/sections/:id", getStudySectionById);

module.exports = router;
