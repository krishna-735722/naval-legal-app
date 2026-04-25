require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const sectionRoutes = require("./routes/sections");
const sessionRoutes = require("./routes/sessions");
const studyRoutes = require("./routes/study");

const app = express();
app.set("trust proxy", 1);
// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
const path = require("path");

// Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

// API docs route
app.get("/docs", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "api-docs.html"));
});
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/study", studyRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Naval Legal Companion API is running" });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`\n🚀 Naval Legal Companion API running on port ${PORT}`);
  console.log(`   ENV: ${process.env.NODE_ENV}`);

  // Warm up Gemini SDK so first real request is fast (skip in dev to save quota)
  if (process.env.NODE_ENV === "production") {
    warmupGemini();
  }
});

/**
 * Pre-warm the Gemini API connection on server start.
 * This eliminates the cold-start delay on the first user request.
 */
async function warmupGemini() {
  try {
    const { GoogleGenAI } = require("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const start = Date.now();
    await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Reply with OK",
      config: { maxOutputTokens: 5, temperature: 0 },
    });
    console.log(`✅ Gemini warm-up complete (${Date.now() - start}ms)`);
  } catch (err) {
    console.warn("⚠️  Gemini warm-up failed (non-critical):", err.message);
  }
}
