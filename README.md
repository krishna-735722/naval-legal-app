# ⚓ Naval Legal Companion — Backend API

Node.js + Express + MongoDB backend for the Naval Legal Companion app.

---

## 🗂 Project Structure

```
naval-legal-backend/
├── app.js                        # Entry point
├── .env                          # Your environment variables
├── .env.example                  # Reference for env vars
├── package.json
│
├── config/
│   └── db.js                     # MongoDB connection
│
├── controllers/
│   ├── authController.js         # OTP login logic
│   ├── sectionController.js      # Section lookup logic
│   ├── sessionController.js      # Charge drafting flow
│   └── studyController.js        # Study mode logic
│
├── routes/
│   ├── auth.js
│   ├── sections.js
│   ├── sessions.js
│   └── study.js
│
├── models/
│   ├── User.js                   # User (email + OTP + saved charges)
│   ├── Section.js                # Navy Act / BNS sections
│   └── Session.js                # Charge drafting sessions
│
├── services/
│   ├── emailService.js           # Nodemailer OTP emails
│   ├── classifierService.js      # OpenAI scenario classifier
│   ├── chargeBuilder.js          # Template-based charge assembly
│   └── searchService.js          # Fuse.js fuzzy search
│
├── middleware/
│   └── auth.js                   # JWT protect + optionalAuth
│
├── data/
│   └── navy_sections_seed.json   # Seed data for sections
│
└── utils/
    └── seedData.js               # Run: npm run seed
```

---

## 🚀 Setup & Installation

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your values
```

**Key values to set in .env:**
| Variable | What to put |
|---|---|
| `MONGO_URI` | Your MongoDB connection string |
| `JWT_SECRET` | Any long random string |
| `OPENAI_API_KEY` | Your OpenAI API key (gpt-4o-mini) |
| `EMAIL_USER` | Your Gmail address |
| `EMAIL_PASS` | Gmail App Password (not your Gmail password) |

> **Gmail App Password:** Go to Google Account → Security → 2FA → App Passwords → Generate one for "Mail"

### 3. Seed the database
```bash
npm run seed
```

### 4. Start the server
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

---

## 📡 API Reference

### AUTH

#### Send OTP
```
POST /api/auth/send-otp
Body: { "email": "user@example.com" }
Response: { success, message }
```

#### Verify OTP
```
POST /api/auth/verify-otp
Body: { "email": "user@example.com", "otp": "123456" }
Response: { success, token, user }
```

#### Get Profile (protected)
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
Response: { success, user }
```

---

### SECTION LOOKUP

#### Smart Search
```
POST /api/sections/lookup
Body: { "query": "desertion" }
       OR { "query": "Section 49" }
       OR { "query": "sailor left ship" }
Optional: { "source": "Navy Act 1957" | "BNS 2023" }
Response: { success, matchType, results[] }
```

#### Get All Sections
```
GET /api/sections?source=Navy Act 1957&page=1&limit=20
Response: { success, total, pages, sections[] }
```

#### Get Full Section by ID
```
GET /api/sections/:mongoId
Response: { success, section }
```

---

### CHARGE DRAFTER (Sessions)

#### Step 1 — Start Session (describe scenario)
```
POST /api/sessions/start
Body: { "scenario": "A sailor stole metal parts from the ship and sold them outside" }
Headers: Authorization: Bearer <token>  (optional)
Response: {
  success,
  session_id,          ← SAVE THIS
  identified: { offence_title, navy_act_section, bns_section, is_civil_offence, ... },
  next_question: { field, question, hint, icon },
  status: "collecting_fields",
  fields_remaining: 4
}
```

#### Step 2 — Answer Questions (repeat until status = "drafted")
```
POST /api/sessions/:session_id/respond
Body: { "field": "date", "value": "05 April 2025" }
Response (more questions):
  { success, status: "collecting_fields", next_question, fields_remaining }

Response (charge ready):
  { success, status: "drafted", final_charge: "AB Ramesh Kumar, did at about..." }
```

#### Get Session Status (resume session)
```
GET /api/sessions/:session_id/status
Response: { success, status, identified, collected_fields, next_question, final_charge }
```

#### Save Charge to Profile (protected)
```
POST /api/sessions/:session_id/save
Headers: Authorization: Bearer <token>
Response: { success, message }
```

#### Get Saved Charges (protected)
```
GET /api/sessions/saved/list
Headers: Authorization: Bearer <token>
Response: { success, charges[] }
```

---

### STUDY MODE

#### All Sections for Study
```
GET /api/study/sections?source=Navy Act 1957
Response: { success, count, sections[] }
```

#### Flashcards
```
GET /api/study/flashcards
Response: { success, count, flashcards[] }
Each flashcard: { question, answer_title, answer_ingredients, punishment }
```

---

## 💡 How the Charge Drafting Flow Works

```
Frontend                          Backend
   |                                 |
   |── POST /sessions/start ────────►|
   |   { scenario: "sailor stole" }  |  1. Receive scenario
   |                                 |  2. Send to OpenAI ONCE → get section info
   |                                 |  3. Create session in MongoDB
   |◄── { session_id, next_q } ──────|  4. Return first question
   |                                 |
   |── POST /sessions/:id/respond ──►|
   |   { field: "date", value: "..." }|  5. Store answer
   |◄── { next_q } ─────────────────|  6. Return next question (pure logic, no AI)
   |                                 |
   |── POST /sessions/:id/respond ──►|  (repeat until all fields collected)
   |   { field: "time", value: "..." }|
   |                                 |
   |◄── { status: "drafted",         |  7. All fields collected → assemble charge
   |      final_charge: "..." } ─────|     (template engine, no AI)
```

**Key design principle:**
- OpenAI is called EXACTLY ONCE per session (scenario classification only)
- Everything else is deterministic — your logic, your templates
- Charges are legally formatted and consistently structured

---

## 🔧 Adding More Sections

Edit `data/navy_sections_seed.json` and add new section objects, then:
```bash
npm run seed
```

The seed script uses upsert — safe to run multiple times.

---

## 📦 Libraries Used

| Library | Purpose |
|---|---|
| `express` | Web framework |
| `mongoose` | MongoDB ODM |
| `jsonwebtoken` | JWT auth |
| `nodemailer` | Send OTP emails |
| `openai` | Scenario classification (gpt-4o-mini) |
| `fuse.js` | Fuzzy search on sections |
| `helmet` | Security headers |
| `cors` | Cross-origin requests |
| `express-rate-limit` | OTP rate limiting |
| `morgan` | Request logging |
| `uuid` | Session ID generation |
| `bcryptjs` | Available for future use |
| `dotenv` | Environment variables |
| `nodemon` | Dev auto-restart |
