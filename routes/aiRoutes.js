const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const generateAIResponse = require("../services/groqService");

const router = express.Router();

router.post("/chat", protect, async (req, res) => {
  // console.log("User in Route:", req.user)
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const reply = await generateAIResponse(message, req.user);
    // console.log(reply)

    res.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


module.exports = router;
