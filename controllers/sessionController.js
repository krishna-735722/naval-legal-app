const { v4: uuidv4 } = require("uuid");
const Session = require("../models/Session");
const User = require("../models/User");
const { classifyScenario } = require("../services/classifierService");
const {
  getNextQuestion,
  allFieldsCollected,
  assembleCharge,
} = require("../services/chargeBuilder");

/**
 * POST /api/sessions/start
 * Starts a new charge drafting session.
 * Body: { scenario }
 * This triggers AI classification — ONLY AI call in the flow.
 */
const startSession = async (req, res) => {
  try {
    const { scenario } = req.body;

    if (!scenario || scenario.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Please describe the incident in at least a few words.",
      });
    }

    // Classify the scenario using OpenAI
    const classification = await classifyScenario(scenario);

    if (!classification.success) {
      return res.status(422).json({
        success: false,
        message: classification.error,
      });
    }

    const { data } = classification;

    // Create session in MongoDB
    const session = await Session.create({
      session_id: uuidv4(),
      user_id: req.user?._id || null,
      scenario: scenario.trim(),
      identified_section: {
        navy_act_section: data.navy_act_section,
        navy_act_title: data.navy_act_title,
        bns_section: data.bns_section,
        bns_title: data.bns_title,
        offence_title: data.offence_title,
        is_civil_offence: data.is_civil_offence,
        required_fields: data.required_fields,
      },
      collected_fields: {},
      status: "collecting_fields",
      conversation_history: [
        { role: "user", message: scenario },
        {
          role: "system",
          message: `Identified: ${data.offence_title} under Section ${data.navy_act_section} of Navy Act${data.bns_section ? ` read with BNS Section ${data.bns_section}` : ""}`,
        },
      ],
    });

    // Get first question to ask
    const nextQuestion = getNextQuestion(data.required_fields, {});

    res.json({
      success: true,
      session_id: session.session_id,
      identified: {
        offence_title: data.offence_title,
        navy_act_section: data.navy_act_section,
        navy_act_title: data.navy_act_title,
        bns_section: data.bns_section,
        bns_title: data.bns_title,
        is_civil_offence: data.is_civil_offence,
        severity: data.severity,
        classification_note: data.classification_note,
      },
      next_question: nextQuestion,
      status: "collecting_fields",
      fields_remaining: data.required_fields.length,
    });
  } catch (error) {
    console.error("startSession error:", error.message);
    res.status(500).json({ success: false, message: "Failed to start session. Try again." });
  }
};

/**
 * POST /api/sessions/:session_id/respond
 * User answers a question. Backend processes answer and returns next question
 * or final charge if all fields are collected.
 * Body: { field, value }
 * field: "date" | "time" | "ship_name" | "accused_name" | "accused_rank" | "description" | "victim_name"
 */
const respondToSession = async (req, res) => {
  try {
    const { session_id } = req.params;
    const { field, value } = req.body;

    if (!field || value === undefined || value === null) {
      return res.status(400).json({ success: false, message: "field and value are required" });
    }

    const session = await Session.findOne({ session_id });
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found or expired" });
    }

    if (session.status === "drafted") {
      return res.json({
        success: true,
        status: "drafted",
        final_charge: session.final_charge,
        message: "Charge already framed.",
      });
    }

    // Update the collected field
    const allowedFields = ["date", "time", "ship_name", "accused_name", "accused_rank", "description", "victim_name"];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ success: false, message: `Unknown field: ${field}` });
    }

    session.collected_fields[field] = value.toString().trim();
    session.conversation_history.push({ role: "user", message: `${field}: ${value}` });

    // Check if all required fields are now collected
    const allDone = allFieldsCollected(
      session.identified_section.required_fields,
      session.collected_fields
    );

    if (allDone) {
      // Assemble the final charge
      const finalCharge = assembleCharge(session.identified_section, session.collected_fields);

      session.final_charge = finalCharge;
      session.status = "drafted";
      session.conversation_history.push({ role: "system", message: "Charge successfully framed." });
      await session.save();

      return res.json({
        success: true,
        status: "drafted",
        final_charge: finalCharge,
        identified: session.identified_section,
        collected_fields: session.collected_fields,
        message: "Charge framed successfully.",
      });
    }

    // More fields needed — get next question
    const nextQuestion = getNextQuestion(
      session.identified_section.required_fields,
      session.collected_fields
    );

    await session.save();

    const remaining = session.identified_section.required_fields.filter(
      (f) => !session.collected_fields[f]
    ).length;

    res.json({
      success: true,
      status: "collecting_fields",
      next_question: nextQuestion,
      fields_remaining: remaining,
      collected_so_far: session.collected_fields,
    });
  } catch (error) {
    console.error("respondToSession error:", error.message);
    res.status(500).json({ success: false, message: "Failed to process response." });
  }
};

/**
 * GET /api/sessions/:session_id/status
 * Returns current session state — useful for resuming sessions.
 */
const getSessionStatus = async (req, res) => {
  try {
    const session = await Session.findOne({ session_id: req.params.session_id });

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    const nextQuestion =
      session.status !== "drafted"
        ? getNextQuestion(session.identified_section.required_fields, session.collected_fields)
        : null;

    res.json({
      success: true,
      session_id: session.session_id,
      status: session.status,
      scenario: session.scenario,
      identified: session.identified_section,
      collected_fields: session.collected_fields,
      next_question: nextQuestion,
      final_charge: session.final_charge,
    });
  } catch (error) {
    console.error("getSessionStatus error:", error.message);
    res.status(500).json({ success: false, message: "Failed to get session status." });
  }
};

/**
 * POST /api/sessions/:session_id/save
 * Saves the drafted charge to user's profile. Requires auth.
 */
const saveCharge = async (req, res) => {
  try {
    const session = await Session.findOne({ session_id: req.params.session_id });

    if (!session || session.status !== "drafted") {
      return res.status(400).json({ success: false, message: "No drafted charge found in this session." });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        savedCharges: {
          charge: session.final_charge,
          section: `Section ${session.identified_section.navy_act_section} Navy Act${session.identified_section.bns_section ? ` + BNS ${session.identified_section.bns_section}` : ""}`,
        },
      },
    });

    res.json({ success: true, message: "Charge saved to your profile." });
  } catch (error) {
    console.error("saveCharge error:", error.message);
    res.status(500).json({ success: false, message: "Failed to save charge." });
  }
};

/**
 * GET /api/sessions/saved
 * Returns all saved charges for logged-in user.
 */
const getSavedCharges = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("savedCharges");
    res.json({
      success: true,
      charges: user.savedCharges.sort((a, b) => b.createdAt - a.createdAt),
    });
  } catch (error) {
    console.error("getSavedCharges error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch saved charges." });
  }
};

module.exports = {
  startSession,
  respondToSession,
  getSessionStatus,
  saveCharge,
  getSavedCharges,
};
