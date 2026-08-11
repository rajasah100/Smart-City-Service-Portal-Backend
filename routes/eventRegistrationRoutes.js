const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");
const role = require("../middleware/roleMiddleware");

const router = express.Router();

// @route POST /api/event-registration/:id/register
// @desc Register for an Event
// @access Private/User
router.post("/:id/register", protect, async (req, res) => {
  try {
    const { phone } = req.body;

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    // Registration Required
    if (!event.isRegistrationRequired) {
      return res.status(400).json({
        success: false,
        message: "Registration is not required for this event.",
      });
    }

    // Duplicate Registration
    const alreadyRegistered = await EventRegistration.findOne({
      event: event._id,
      user: req.user._id,
    });

    if (alreadyRegistered) {
      return res.status(400).json({
        success: false,
        message: "You have already registered for this event.",
      });
    }

    // Check Participant limit
    if (
      event.maxParticipants > 0 &&
      event.currentParticipants + 1 > event.maxParticipants
    ) {
      return res.status(400).json({
        success: false,
        message: "Participant limit reached.",
      });
    }

    // Create Registration
    const registration = await EventRegistration.create({
      event: event._id,
      user: req.user._id,
      fullName: req.user.name,
      email: req.user.email,
      phone,
    });

    // Update Event Count
    event.currentParticipants += 1;
    await event.save();

    res.status(201).json({
      success: true,
      message: "Event registered successfully.",
      registration,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route GET /api/event-registrations
// @desc Get all event registrations
// @access Private/Admin

router.get("/", protect, role("admin"), async (req, res) => {
  try {
    const registrations = await EventRegistration.find()
      .populate("event", "title")
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      registrations,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route GET /api/event-registrations/:id
// @desc Get all registrations of an event
// @access Private/Admin
router.get("/:id", protect, role("admin"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const registrations = await EventRegistration.find({
      event: req.params.id,
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      registrations,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
