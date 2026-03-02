const Section = require("../models/Section");

/**
 * GET /api/study/sections
 * Returns all sections formatted for Study Mode — ingredients + specimen charges.
 * Optional filter: source query param
 */
const getStudySections = async (req, res) => {
  try {
    const { source } = req.query;
    const filter = {};
    if (source) filter.source = source;

    const sections = await Section.find(filter)
      .select("source section_number title ingredients punishment specimen_charge related_sections")
      .sort({ source: 1, section_number: 1 });

    res.json({
      success: true,
      count: sections.length,
      sections,
    });
  } catch (error) {
    console.error("getStudySections error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch study sections." });
  }
};

/**
 * GET /api/study/sections/:id
 * Returns a single section in study mode format with full text.
 */
const getStudySectionById = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);

    if (!section) {
      return res.status(404).json({ success: false, message: "Section not found." });
    }

    res.json({ success: true, section });
  } catch (error) {
    console.error("getStudySectionById error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch section." });
  }
};

/**
 * GET /api/study/flashcards
 * Returns simplified flashcard-style data for quick revision.
 */
const getFlashcards = async (req, res) => {
  try {
    const { source } = req.query;
    const filter = {};
    if (source) filter.source = source;

    const sections = await Section.find(filter)
      .select("source section_number title ingredients punishment")
      .sort({ source: 1, section_number: 1 });

    const flashcards = sections.map((s) => ({
      id: s._id,
      source: s.source,
      section_number: s.section_number,
      question: `What is Section ${s.section_number} of ${s.source}?`,
      answer_title: s.title,
      answer_ingredients: s.ingredients,
      punishment: s.punishment,
    }));

    res.json({ success: true, count: flashcards.length, flashcards });
  } catch (error) {
    console.error("getFlashcards error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch flashcards." });
  }
};

module.exports = { getStudySections, getStudySectionById, getFlashcards };
