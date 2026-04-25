const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    session_id: { type: String, required: true, unique: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // null = guest
    scenario: { type: String },             // Original user input
    identified_section: {
      navy_act_section: { type: String },
      navy_act_title: { type: String },
      bns_section: { type: String },
      bns_title: { type: String },
      offence_title: { type: String },
      is_civil_offence: { type: Boolean },
      required_fields: [{ type: String }],  // ["date","time","ship_name","accused_name","description"]
    },
    collected_fields: {
      date: { type: String, default: null },
      time: { type: String, default: null },
      ship_name: { type: String, default: null },
      accused_name: { type: String, default: null },
      accused_rank: { type: String, default: null },
      description: { type: String, default: null },
      victim_name: { type: String, default: null },
    },
    status: {
      type: String,
      enum: ["new", "identifying", "collecting_fields", "ready", "drafted"],
      default: "new",
    },
    final_charge: { type: String, default: null },
    conversation_history: [
      {
        role: { type: String, enum: ["user", "system"] },
        message: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  },
  { timestamps: true }
);

// Auto-delete expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Session", sessionSchema);
