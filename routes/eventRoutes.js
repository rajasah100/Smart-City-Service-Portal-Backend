const express = require("express");
const mongoose = require("mongoose");
const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");
const { protect } = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  eventUpload,
  uploadFileToCloudinary,
  cloudinary,
} = require("../config/cloudinaryConfig");

const router = express.Router();

const getEventStatus = (event) => {
  if (event.isCancelled) {
    return "cancelled";
  }

  const start = new Date(event.startDate);
  const [startHour, startMinute] = event.startTime.split(":").map(Number);
  start.setHours(startHour, startMinute, 0, 0);

  const end = new Date(event.endDate);
  const [endHour, endMinute] = event.endTime.split(":").map(Number);
  end.setHours(endHour, endMinute, 0, 0);

  const now = new Date();

  if (now < start) {
    return "upcoming";
  }

  if (now >= start && now <= end) {
    return "ongoing";
  }

  return "completed";
};

// @route POST /api/events
// @desc Create Event
// @access Private/Admin
router.post("/", protect, role("admin"), eventUpload, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      organizer,
      contact,
      email,
      startDate,
      endDate,
      startTime,
      endTime,
      isRegistrationRequired,
      maxParticipants,
      isFeatured,
      province,
      district,
      municipality,
      ward,
      tole,
      venue,
    } = req.body;

    if (
      !title ||
      !description ||
      !organizer ||
      !contact ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date.",
      });
    }

    let image = {};

    if (req.file) {
      const uploaded = await uploadFileToCloudinary(req.file);

      image = {
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        altText: title,
      };
    }

    const event = new Event({
      title,
      description,
      category,
      image,
      organizer,
      contact,
      email,
      startDate,
      endDate,
      startTime,
      endTime,
      isRegistrationRequired: isRegistrationRequired === "true",
      maxParticipants: Number(maxParticipants) || 0,
      isFeatured: isFeatured === "true",

      location: {
        province,
        district,
        municipality,
        ward,
        tole,
        venue,
      },

      createdBy: req.user._id,
    });

    await event.save();

    const eventData = event.toObject();
    eventData.status = getEventStatus(eventData);

    res.status(201).json({
      success: true,
      message: "Event created successfully.",
      event: eventData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route GET /api/events
// @desc Get All Events
// @access Public
router.get("/", async (req, res) => {
  try {
    const events = await Event.find()
      .populate("createdBy", "name email")
      .sort({ startDate: 1 });

    const updatedEvents = events.map((event) => {
      const obj = event.toObject();

      obj.status = getEventStatus(obj);

      return obj;
    });

    res.status(200).json({
      success: true,
      events: updatedEvents,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route GET /api/events/:id
// @desc Get Single Event
// @access Public
router.get("/:id", async (req, res) => {
  try {
    // Galat ID ma 500 haina, 404 pathaune
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    const event = await Event.findById(req.params.id).populate(
      "createdBy",
      "name email",
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const eventData = event.toObject();

    eventData.status = getEventStatus(eventData);

    res.status(200).json({
      success: true,
      event: eventData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route GET /api/event-registration/:id/check
// @desc Check if current user already registered
// @access Private/User
router.get("/:id/check", protect, async (req, res) => {
  try {
    const registration = await EventRegistration.findOne({
      event: req.params.id,
      user: req.user._id,
    });

    res.status(200).json({
      success: true,
      isRegistered: !!registration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route PUT /api/events/:id
// @desc Update Event
// @access Private/Admin
router.put("/:id", protect, role("admin"), eventUpload, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const newStart = new Date(req.body.startDate || event.startDate);
    const newEnd = new Date(req.body.endDate || event.endDate);

    if (newEnd < newStart) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date.",
      });
    }

    // Upload new image if provided
    if (req.file) {
      // Delete old image from Cloudinary
      if (event.image?.publicId) {
        await cloudinary.uploader.destroy(event.image.publicId);
      }

      // Upload new image
      const uploaded = await uploadFileToCloudinary(req.file);

      req.body.image = {
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        altText: req.body.title || event.title,
      };
    }

    // FormData bata "true"/"false" string, JSON bata boolean aauna sakcha.
    // Pathaeko field matra update garne (cancel garda aru data nametiyos)
    ["isRegistrationRequired", "isFeatured", "isCancelled"].forEach((field) => {
      if (req.body[field] !== undefined) {
        req.body[field] = String(req.body[field]) === "true";
      }
    });

    // Update location (form bata location aayo bhane matra)
    const locationFields = [
      "province",
      "district",
      "municipality",
      "ward",
      "tole",
      "venue",
    ];

    if (locationFields.some((field) => req.body[field] !== undefined)) {
      req.body.location = { ...event.location?.toObject?.() };

      locationFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          req.body.location[field] = req.body[field];
        }
      });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      success: true,
      message: "Event updated successfully.",
      event: updatedEvent,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route DELETE /api/events/:id
// @desc Delete Event
//@access Private/Admin
router.delete("/:id", protect, role("admin"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    if (event.image?.publicId) {
      await cloudinary.uploader.destroy(event.image.publicId);
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: "Event deleted successfully.",
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
