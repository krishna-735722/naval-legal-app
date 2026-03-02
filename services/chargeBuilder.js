/**
 * CHARGE BUILDER SERVICE
 * Assembles the final formal charge using collected fields.
 * NO AI involved here — pure template logic.
 * This keeps charges legally accurate and consistently formatted.
 */

const FIELD_QUESTIONS = {
  date: {
    question: "On what date did this incident occur?",
    hint: "e.g. 05 April 2025",
    icon: "📅",
  },
  time: {
    question: "At approximately what time did this occur?",
    hint: "e.g. 2100 hours",
    icon: "🕐",
  },
  ship_name: {
    question: "From which Indian Naval Ship?",
    hint: "e.g. INS Vikrant",
    icon: "⚓",
  },
  accused_name: {
    question: "Full name of the accused?",
    hint: "e.g. AB Ramesh Kumar",
    icon: "👤",
  },
  accused_rank: {
    question: "Rank of the accused? (optional — press skip if not available)",
    hint: "e.g. Able Seaman, Petty Officer, Lieutenant",
    icon: "🎖️",
    optional: true,
  },
  victim_name: {
    question: "Name of the victim?",
    hint: "e.g. PO Suresh Sharma",
    icon: "👤",
  },
  description: {
    question: "Brief description of the property / what was stolen or damaged?",
    hint: "e.g. copper wire and metal parts, approx 5kg",
    icon: "📝",
  },
};

/**
 * Returns the next question to ask based on missing fields.
 * Returns null if all fields are collected.
 */
const getNextQuestion = (requiredFields, collectedFields) => {
  for (const field of requiredFields) {
    if (!collectedFields[field]) {
      return {
        field,
        ...FIELD_QUESTIONS[field],
      };
    }
  }
  return null; // All fields collected
};

/**
 * Checks if all required fields are filled.
 */
const allFieldsCollected = (requiredFields, collectedFields) => {
  return requiredFields.every(
    (field) => collectedFields[field] || FIELD_QUESTIONS[field]?.optional
  );
};

/**
 * Assembles the final charge string.
 * Uses the identified section and all collected fields.
 */
const assembleCharge = (identifiedSection, collectedFields) => {
  const {
    navy_act_section,
    navy_act_title,
    bns_section,
    bns_title,
    offence_title,
    is_civil_offence,
  } = identifiedSection;

  const {
    date,
    time,
    ship_name,
    accused_name,
    accused_rank,
    description,
    victim_name,
  } = collectedFields;

  const accusedFull = accused_rank
    ? `${accused_rank} ${accused_name}`
    : accused_name;

  let charge = "";

  // ─── Civil Offence (Section 77 read with BNS) ────────────────────────────
  if (is_civil_offence && bns_section) {
    if (offence_title.toLowerCase().includes("theft")) {
      charge = `${accusedFull}, did at about ${time} hours on ${date}, commit theft of ${description || "property"} belonging to Indian Naval Ship ${ship_name}, and thereby committed a civil offence punishable under Section ${bns_section} of the Bharatiya Nyaya Sanhita, 2023, read with Section ${navy_act_section} of the Navy Act, 1957, in that he/she dishonestly removed the said property of the ship.`;
    } else if (
      offence_title.toLowerCase().includes("assault") ||
      offence_title.toLowerCase().includes("hurt")
    ) {
      charge = `${accusedFull}, did at about ${time} hours on ${date}, onboard Indian Naval Ship ${ship_name}, commit assault on ${victim_name || "a fellow service member"}, and thereby committed a civil offence punishable under Section ${bns_section} of the Bharatiya Nyaya Sanhita, 2023, read with Section ${navy_act_section} of the Navy Act, 1957.`;
    } else if (
      offence_title.toLowerCase().includes("fraud") ||
      offence_title.toLowerCase().includes("cheat")
    ) {
      charge = `${accusedFull}, did at about ${time} hours on ${date}, onboard Indian Naval Ship ${ship_name}, commit ${offence_title.toLowerCase()} involving ${description || "public property or funds"}, and thereby committed a civil offence punishable under Section ${bns_section} of the Bharatiya Nyaya Sanhita, 2023, read with Section ${navy_act_section} of the Navy Act, 1957.`;
    } else {
      // Generic civil offence template
      charge = `${accusedFull}, did at about ${time} hours on ${date}, onboard Indian Naval Ship ${ship_name}, commit ${offence_title.toLowerCase()}${description ? " involving " + description : ""}, and thereby committed a civil offence punishable under Section ${bns_section} of the Bharatiya Nyaya Sanhita, 2023, read with Section ${navy_act_section} of the Navy Act, 1957.`;
    }
  }
  // ─── Navy Act Only Offences ───────────────────────────────────────────────
  else if (navy_act_section === "49" || navy_act_section === "50") {
    // Desertion / Attempted Desertion
    charge = `${accusedFull}, did on ${date}, desert from Indian Naval Ship ${ship_name}, and thereby committed an offence punishable under Section ${navy_act_section} of the Navy Act, 1957, in that he/she absented himself/herself from the said ship with the intention of not returning.`;
  } else if (navy_act_section === "51") {
    // Absence Without Leave
    charge = `${accusedFull}, did on ${date}, absent himself/herself without leave from Indian Naval Ship ${ship_name} from about ${time} hours, and thereby committed an offence punishable under Section 51 of the Navy Act, 1957.`;
  } else if (navy_act_section === "52" || navy_act_section === "55") {
    // Insubordination / Striking superior
    charge = `${accusedFull}, did at about ${time} hours on ${date}, onboard Indian Naval Ship ${ship_name}, use ${offence_title.toLowerCase()} against ${victim_name || "a superior officer"}, and thereby committed an offence punishable under Section ${navy_act_section} of the Navy Act, 1957.`;
  } else if (navy_act_section === "53") {
    // Disobedience
    charge = `${accusedFull}, did at about ${time} hours on ${date}, onboard Indian Naval Ship ${ship_name}, disobey a lawful command given to him/her by ${victim_name || "a superior officer"}, and thereby committed an offence punishable under Section 53 of the Navy Act, 1957.`;
  } else if (navy_act_section === "48") {
    // Drunk / sleeping on duty
    charge = `${accusedFull}, did at about ${time} hours on ${date}, onboard Indian Naval Ship ${ship_name}, was found ${description || "drunk/asleep"} while on duty, and thereby committed an offence punishable under Section 48 of the Navy Act, 1957.`;
  } else {
    // Generic Navy Act template
    charge = `${accusedFull}, did at about ${time} hours on ${date}, onboard Indian Naval Ship ${ship_name}, commit ${offence_title.toLowerCase()}${description ? ", involving " + description : ""}, and thereby committed an offence punishable under Section ${navy_act_section} of the Navy Act, 1957 (${navy_act_title}).`;
  }

  return charge;
};

module.exports = { getNextQuestion, allFieldsCollected, assembleCharge, FIELD_QUESTIONS };
