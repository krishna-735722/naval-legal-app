const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: true,
      enum: ["Navy Act 1957", "BNS 2023"],
    },
    section_number: { type: String, required: true },
    title: { type: String, required: true },
    text: { type: String, required: true },
    ingredients: [{ type: String }],         // Key legal elements
    punishment: { type: String },            // e.g., "Up to 2 years imprisonment"
    is_civil_offence: { type: Boolean, default: false },
    bns_read_with: { type: String, default: null }, // BNS section number to read with
    keywords: [{ type: String }],            // For fuzzy search
    specimen_charge: { type: String },       // Example charge text for Study Mode
    related_sections: [{ type: String }],    // e.g., ["51", "52"]
  },
  { timestamps: true }
);

// Text index for full-text search
sectionSchema.index({ title: "text", text: "text", keywords: "text" });

module.exports = mongoose.model("Section", sectionSchema);
