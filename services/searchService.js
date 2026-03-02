const Fuse = require("fuse.js");
const Section = require("../models/Section");

let fuseInstance = null;
let sectionsCache = [];

/**
 * Initialize Fuse.js index from MongoDB sections.
 * Called once at app start and can be refreshed.
 */
const initSearchIndex = async () => {
  try {
    sectionsCache = await Section.find({}).lean();
    fuseInstance = new Fuse(sectionsCache, {
      keys: [
        { name: "section_number", weight: 0.4 },
        { name: "title", weight: 0.35 },
        { name: "keywords", weight: 0.15 },
        { name: "text", weight: 0.1 },
      ],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 2,
    });
    console.log(`✅ Search index built with ${sectionsCache.length} sections`);
  } catch (error) {
    console.error("Search index error:", error.message);
  }
};

/**
 * Smart section search.
 * 1. Try exact section number match first.
 * 2. Fall back to fuzzy text search.
 */
const searchSections = async (query, source = null) => {
  if (!fuseInstance) await initSearchIndex();

  const trimmedQuery = query.trim();

  // --- Exact section number match ---
  // Handles: "49", "Section 49", "section 49", "sec 49"
  const sectionNumberMatch = trimmedQuery.match(/^(?:section\s*|sec\s*)?(\d+[a-z]?)$/i);
  if (sectionNumberMatch) {
    const num = sectionNumberMatch[1];
    let exactMatches = sectionsCache.filter(
      (s) => s.section_number.toLowerCase() === num.toLowerCase()
    );
    if (source) exactMatches = exactMatches.filter((s) => s.source === source);
    if (exactMatches.length > 0) {
      return { matchType: "exact", results: exactMatches };
    }
  }

  // --- Fuzzy search ---
  let results = fuseInstance.search(trimmedQuery);
  if (source) results = results.filter((r) => r.item.source === source);

  return {
    matchType: "fuzzy",
    results: results.slice(0, 6).map((r) => ({
      ...r.item,
      _score: r.score,
    })),
  };
};

module.exports = { searchSections, initSearchIndex };
