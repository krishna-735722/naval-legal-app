const Section = require("../models/Section");
const { searchSections } = require("../services/searchService");

/**
 * POST /api/sections/lookup
 * Body: { query, source? }
 * Smart search — exact section number or fuzzy keyword search.
 */
const lookupSection = async (req, res) => {
  try {
    const { query, source } = req.body;

    if (!query || query.trim().length < 1) {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }

    const { matchType, results } = await searchSections(query, source);

    if (results.length === 0) {
      return res.json({
        success: true,
        matchType,
        results: [],
        message: "No sections found. Try different keywords.",
      });
    }

    res.json({
      success: true,
      matchType,
      count: results.length,
      results: results.map((s) => ({
        id: s._id,
        source: s.source,
        section_number: s.section_number,
        title: s.title,
        ingredients: s.ingredients,
        punishment: s.punishment,
        is_civil_offence: s.is_civil_offence,
        bns_read_with: s.bns_read_with,
        related_sections: s.related_sections,
        // Truncate full text for list view
        text_preview: s.text ? s.text.substring(0, 200) + "..." : null,
      })),
    });
  } catch (error) {
    console.error("lookupSection error:", error.message);
    res.status(500).json({ success: false, message: "Search failed. Try again." });
  }
};

/**
 * GET /api/sections/:id
 * Returns full section details including full text and specimen charge.
 */
const getSectionById = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);

    if (!section) {
      return res.status(404).json({ success: false, message: "Section not found" });
    }

    res.json({ success: true, section });
  } catch (error) {
    console.error("getSectionById error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch section" });
  }
};

/**
 * GET /api/sections
 * List all sections with optional filters.
 * Query params: source, is_civil_offence, page, limit
 */
const getAllSections = async (req, res) => {
  try {
    const { source, is_civil_offence, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (source) filter.source = source;
    if (is_civil_offence !== undefined) filter.is_civil_offence = is_civil_offence === "true";

    const total = await Section.countDocuments(filter);
    const sections = await Section.find(filter)
      .select("source section_number title ingredients punishment is_civil_offence bns_read_with")
      .sort({ section_number: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      sections,
    });
  } catch (error) {
    console.error("getAllSections error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch sections" });
  }
};

module.exports = { lookupSection, getSectionById, getAllSections };
