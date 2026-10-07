const express = require("express");
const SiteSetting = require("../models/SiteSetting");
const User = require("../models/User");
const Complaint = require("../models/Complaint");
const Notice = require("../models/Notice");
const Event = require("../models/Event");
const { protect } = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  cloudinary,
  logoUpload,
  uploadFileToCloudinary,
} = require("../config/cloudinaryConfig");

const router = express.Router();

const EDITABLE_FIELDS = [
  "nameNe",
  "nameEn",
  "officeNe",
  "officeEn",
  "addressNe",
  "addressEn",
  "phone",
  "email",
  "hotline",
  "officeHoursNe",
  "officeHoursEn",
  "introNe",
  "introEn",
  "facebook",
  "youtube",
  "instagram",
  "tiktok",
];

const SOCIAL_FIELDS = ["facebook", "youtube", "instagram", "tiktok"];

// Setting chaina bhane default sanga banaune
const getSettings = () =>
  SiteSetting.findOneAndUpdate(
    { key: "main" },
    { $setOnInsert: { key: "main" } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

// @route GET /api/settings
// @desc Get municipality profile (name, logo, address)
// @access Public
router.get("/", async (req, res) => {
  try {
    const settings = await getSettings();

    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Home page ko asli tathyanka. Har request ma database nagannu bhanera 5 minute cache
let statsCache = { data: null, at: 0 };
const STATS_TTL_MS = 5 * 60 * 1000;

// @route GET /api/settings/stats
// @desc Public counts for the home page
// @access Public
router.get("/stats", async (req, res) => {
  try {
    if (!statsCache.data || Date.now() - statsCache.at > STATS_TTL_MS) {
      const [citizens, complaints, resolved, notices, upcomingEvents] =
        await Promise.all([
          User.countDocuments({ role: "user" }),
          Complaint.countDocuments(),
          Complaint.countDocuments({ status: "resolved" }),
          Notice.countDocuments({ status: { $ne: "archived" } }),
          Event.countDocuments({
            isCancelled: { $ne: true },
            endDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          }),
        ]);

      statsCache = {
        data: { citizens, complaints, resolved, notices, upcomingEvents },
        at: Date.now(),
      };
    }

    res.status(200).json({ success: true, stats: statsCache.data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route PUT /api/settings
// @desc Update municipality profile (multipart, optional "logo" file)
// @access Private/Admin
router.put("/", protect, role("admin"), logoUpload, async (req, res) => {
  try {
    const settings = await getSettings();

    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] === undefined) continue;

      const value = String(req.body[field]).trim();

      // Social link https bata suru hunu parcha (javascript: jasta link rokne)
      if (SOCIAL_FIELDS.includes(field) && value && !/^https:\/\//i.test(value)) {
        return res.status(400).json({ message: `${field} link must start with https://` });
      }

      settings[field] = value;
    }

    if (req.file) {
      if (!req.file.mimetype.startsWith("image/")) {
        return res.status(400).json({ message: "Logo must be an image" });
      }

      const uploaded = await uploadFileToCloudinary(req.file);

      if (settings.logo?.publicId) {
        await cloudinary.uploader.destroy(settings.logo.publicId).catch(() => {});
      }

      settings.logo = { url: uploaded.secure_url, publicId: uploaded.public_id };
    } else if (req.body.removeLogo === "true" && settings.logo?.publicId) {
      await cloudinary.uploader.destroy(settings.logo.publicId).catch(() => {});
      settings.logo = { url: "", publicId: "" };
    }

    await settings.save();

    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
