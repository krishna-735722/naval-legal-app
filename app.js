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

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Naval Legal Companion API running on port ${PORT}`);
  console.log(`   ENV: ${process.env.NODE_ENV}`);
});
