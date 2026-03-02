/**
 * SEED SCRIPT
 * Run with: npm run seed
 * Loads navy_sections_seed.json into MongoDB.
 * Safe to run multiple times — uses upsert to avoid duplicates.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Section = require("../models/Section");
const sections = require("../data/navy_sections_seed.json");

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    let created = 0;
    let updated = 0;

    for (const s of sections) {
      const result = await Section.findOneAndUpdate(
        { source: s.source, section_number: s.section_number },
        s,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      if (result.createdAt === result.updatedAt) created++;
      else updated++;
    }

    console.log(`\n📚 Seeding complete!`);
    console.log(`   Created : ${created} sections`);
    console.log(`   Updated : ${updated} sections`);
    console.log(`   Total   : ${sections.length} sections processed`);
    console.log(`\n💡 Tip: Add more sections to data/navy_sections_seed.json and re-run 'npm run seed'\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error.message);
    process.exit(1);
  }
};

seed();
