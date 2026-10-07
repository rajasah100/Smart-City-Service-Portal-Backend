const express = require("express");
const rateLimit = require("express-rate-limit");
const SosAlert = require("../models/SosAlert");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { protect } = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const { responderProtect } = require("../middleware/responderAuth");
const { sendPushNotification } = require("../services/notificationService");
const { alertResponders } = require("../services/sosAlertService");

const router = express.Router();

const MAX_PATH_POINTS = 300;
const OPEN_STATUSES = ["active", "responding"];

// SOS banauna dherai request nagarne (misuse rokne)
const sosCreateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many SOS requests. Please call 100 directly." },
});

const parsePoint = (body) => {
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);

  if (
    Number.isNaN(latitude) ||
    Number.isNaN(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return null;
  }

  const accuracy = Number(body.accuracy);

  return {
    latitude,
    longitude,
    accuracy: Number.isNaN(accuracy) ? null : Math.round(accuracy),
    at: new Date(),
  };
};

const notifyUser = async (sos, title, body) => {
  try {
    await Notification.create({
      recipient: sos.user,
      title,
      message: body,
      type: "emergency",
      referenceId: sos._id,
      route: "/emergency",
    });

    const user = await User.findById(sos.user).select("fcmToken");

    if (user?.fcmToken) {
      await sendPushNotification({
        token: user.fcmToken,
        title,
        body,
        data: { type: "sos", sosId: sos._id, route: "/emergency" },
      });
    }
  } catch (error) {
    // Notification fail bhaye pani SOS update rokinu hudaina
    console.error("SOS notification failed:", error.message);
  }
};

// =============== CITIZEN ===============

// @route POST /api/sos
// @desc Start an SOS (returns existing open SOS if one exists)
// @access Private/User
router.post("/", protect, role("user"), sosCreateLimiter, async (req, res) => {
  try {
    const point = parsePoint(req.body);

    if (!point) {
      return res.status(400).json({ message: "Valid location is required" });
    }

    const existing = await SosAlert.findOne({
      user: req.user._id,
      status: { $in: OPEN_STATUSES },
    });

    if (existing) {
      existing.location = point;
      existing.path.push(point);
      await existing.save();

      return res.status(200).json({ success: true, sos: existing });
    }

    const sos = await SosAlert.create({
      user: req.user._id,
      type: req.body.type,
      message: req.body.message,
      phone: req.body.phone || req.user.phone || "",
      location: point,
      path: [point],
    });

    res.status(201).json({ success: true, sos });

    // Response pathaisake pachi department/admin lai push + email (citizen lai parkhaunu napros)
    alertResponders(sos).catch((error) =>
      console.error("SOS alert failed:", error.message),
    );
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

// @route GET /api/sos/my/active
// @desc Get logged-in user's open SOS (to restore after page refresh)
// @access Private/User
router.get("/my/active", protect, role("user"), async (req, res) => {
  try {
    const sos = await SosAlert.findOne({
      user: req.user._id,
      status: { $in: OPEN_STATUSES },
    }).select("-path");

    res.status(200).json({ success: true, sos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route PUT /api/sos/:id/location
// @desc Send live location update
// @access Private/User (owner)
router.put("/:id/location", protect, role("user"), async (req, res) => {
  try {
    const point = parsePoint(req.body);

    if (!point) {
      return res.status(400).json({ message: "Valid location is required" });
    }

    const sos = await SosAlert.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
        status: { $in: OPEN_STATUSES },
      },
      {
        $set: { location: point },
        $push: { path: { $each: [point], $slice: -MAX_PATH_POINTS } },
      },
      { returnDocument: "after", projection: { path: 0 } },
    );

    if (!sos) {
      return res.status(404).json({ message: "No active SOS found" });
    }

    res.status(200).json({ success: true, sos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route PUT /api/sos/:id/cancel
// @desc Citizen stops the SOS (safe now / false alarm)
// @access Private/User (owner)
router.put("/:id/cancel", protect, role("user"), async (req, res) => {
  try {
    const sos = await SosAlert.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
        status: { $in: OPEN_STATUSES },
      },
      { $set: { status: "cancelled", closedAt: new Date() } },
      { returnDocument: "after", projection: { path: 0 } },
    );

    if (!sos) {
      return res.status(404).json({ message: "No active SOS found" });
    }

    res.status(200).json({ success: true, sos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============== DEPARTMENT / ADMIN ===============

// @route GET /api/sos?status=open|closed
// @desc List SOS alerts (open by default)
// @access Private/Department or Admin
router.get("/", responderProtect, async (req, res) => {
  try {
    const filter =
      req.query.status === "closed"
        ? { status: { $in: ["resolved", "cancelled"] } }
        : { status: { $in: OPEN_STATUSES } };

    const alerts = await SosAlert.find(filter)
      .populate("user", "name phone email avatar")
      .sort({ createdAt: -1 })
      .limit(req.query.status === "closed" ? 50 : 200);

    res.status(200).json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route PUT /api/sos/:id/status
// @desc Mark SOS as responding / resolved
// @access Private/Department or Admin
router.put("/:id/status", responderProtect, async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!["responding", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const sos = await SosAlert.findById(req.params.id);

    if (!sos || !OPEN_STATUSES.includes(sos.status)) {
      return res.status(404).json({ message: "Open SOS not found" });
    }

    sos.status = status;
    if (note) sos.responseNote = note;

    if (status === "responding") {
      sos.respondedBy = req.responder.department;
      sos.responderName = req.responder.name;
      sos.respondedAt = new Date();
    } else {
      sos.closedAt = new Date();
    }

    await sos.save();

    if (status === "responding") {
      await notifyUser(
        sos,
        "Help is on the way",
        `${req.responder.name} has received your SOS and is responding. Stay where you are if it is safe.`,
      );
    } else {
      await notifyUser(
        sos,
        "SOS resolved",
        note || "Your SOS has been marked as resolved. Stay safe.",
      );
    }

    await sos.populate("user", "name phone email avatar");

    res.status(200).json({ success: true, sos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
