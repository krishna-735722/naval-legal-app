const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Keep system prompt lean — less tokens = faster + less chance of truncation
const SYSTEM_PROMPT = `You are an Indian Navy legal expert. Analyze scenarios and identify the correct Navy Act 1957 or BNS 2023 section.

Rules:
- Pure Navy discipline (desertion, disobedience, AWOL, drunk on duty) → Navy Act section only
- Civil crime (theft, assault, fraud, cheating) → Section 77 Navy Act + BNS section

Navy Act sections: 45(misconduct in action), 47(deserting post), 48(drunk/sleeping on duty), 49(desertion), 50(attempted desertion), 51(absence without leave), 52(striking superior), 53(disobedience), 55(criminal force on superior), 57(mutiny), 64(hazarding ship), 75(malingering), 77(civil offences)

BNS sections for Section 77: 303(theft), 309(extortion), 316(cheating), 319(fraud), 329(mischief), 351(assault), 352(assault with hurt), 115(grievous hurt)

Always include date, time, ship_name, accused_name in required_fields.
Add "description" for theft/fraud. Add "victim_name" for assault.

OUTPUT ONLY raw JSON. No markdown. No backticks. No explanation.`;

const classifyScenario = async (scenario) => {
  // Minimal JSON template = fewer output tokens needed
  const userPrompt = `Scenario: "${scenario}"

Respond with ONLY this JSON (fill in the values, keep keys exact):
{"navy_act_section":"","navy_act_title":"","bns_section":null,"bns_title":null,"offence_title":"","is_civil_offence":false,"severity":"","required_fields":["date","time","ship_name","accused_name"],"confidence":"","classification_note":""}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.1,
        maxOutputTokens: 1024,
      },
    });

    const raw = response.text.trim();

    // Log raw response in dev so you can see exactly what Gemini returned
    if (process.env.NODE_ENV === "development") {
      console.log("Gemini raw response:", raw);
    }

    // Aggressively strip any markdown wrapping Gemini adds
    let cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // If there's any text before/after the JSON object, extract just the object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    const parsed = JSON.parse(cleaned);

    // Ensure mandatory fields are always in required_fields
    if (!Array.isArray(parsed.required_fields)) {
      parsed.required_fields = [];
    }
    for (const field of ["date", "time", "ship_name", "accused_name"]) {
      if (!parsed.required_fields.includes(field)) {
        parsed.required_fields.push(field);
      }
    }

    return { success: true, data: parsed };

  } catch (error) {
    console.error("Gemini classifier error:", error.message);
    return {
      success: false,
      error: "Could not classify scenario. Please describe the incident more clearly and try again.",
    };
  }
};

module.exports = { classifyScenario };