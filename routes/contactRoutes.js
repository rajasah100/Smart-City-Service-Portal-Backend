const express = require("express");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const ContactMessage = require("../models/ContactMessage");
const { protect } = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const router = express.Router();

// Spam rokne: euta IP bata 1 ghanta ma 5 message
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many messages. Please try again later." },
});

// @route POST /api/contact
// @desc Send a message from the About page
// @access Public
router.post("/", contactLimiter, async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    await ContactMessage.create({ name, email, phone, subject, message });

    res.status(201).json({ success: true, message: "Message sent successfully." });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route GET /api/contact
// @desc List messages (newest first)
// @access Private/Admin
router.get("/", protect, role("admin"), async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(500);
    const unread = await ContactMessage.countDocuments({ isRead: false });

    res.status(200).json({ success: true, messages, unread });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route PUT /api/contact/:id/read
// @desc Mark message as read / unread
// @access Private/Admin
router.put("/:id/read", protect, role("admin"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Message not found" });
    }

    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { isRead: req.body.isRead !== false },
      { returnDocument: "after" },
    );

    if (!message) return res.status(404).json({ message: "Message not found" });

    res.status(200).json({ success: true, item: message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route DELETE /api/contact/:id
// @access Private/Admin
router.delete("/:id", protect, role("admin"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Message not found" });
    }

    const message = await ContactMessage.findByIdAndDelete(req.params.id);

    if (!message) return res.status(404).json({ message: "Message not found" });

    res.status(200).json({ success: true, id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
