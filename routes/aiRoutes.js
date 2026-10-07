const express = require("express");
const rateLimit = require("express-rate-limit");
const { optionalAuth } = require("../middleware/authMiddleware");
const { askAssistant } = require("../services/aiAssistant");

const router = express.Router();

// AI mahango: ek IP bata minute ma 15 sandesh samma
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: "RATE_LIMIT", message: "Too many messages. Please wait a minute." },
});

// @route POST /api/ai/chat
// @desc Smart City AI sahayak (guest le pani; login bhae aafno gunaso herna milcha)
// @access Public (optional login)
router.post("/chat", aiLimiter, optionalAuth, async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  const language = req.body?.language === "en" ? "en" : "ne";

  if (!message) {
    return res.status(400).json({ success: false, message: "Message is required" });
  }

  if (message.length > 1000) {
    return res.status(400).json({ success: false, message: "Message is too long" });
  }

  try {
    const reply = await askAssistant({ message, history: req.body.history, user: req.user, language });
    res.json({ success: true, reply });
  } catch (error) {
    console.error("AI error:", error.status || "", error.message);
    // AI chalena bhae pani aapatkalin number sadhai dine
    res.status(503).json({ success: false, code: "AI_UNAVAILABLE", message: "AI assistant is not available right now." });
  }
});

module.exports = router;
