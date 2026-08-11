const express = require("express");
const Event = require("../models/Event");
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

    req.body.isRegistrationRequired =
      req.body.isRegistrationRequired === "true";

    req.body.isFeatured = req.body.isFeatured === "true";

    req.body.isCancelled = req.body.isCancelled === "true";

    // Update location
    req.body.location = {
      province: req.body.province,
      district: req.body.district,
      municipality: req.body.municipality,
      ward: req.body.ward,
      tole: req.body.tole,
      venue: req.body.venue,
    };

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
