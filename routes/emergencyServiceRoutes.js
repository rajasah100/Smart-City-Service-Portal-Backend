const express = require("express");
const EmergencyService = require("../models/EmergencyService");
const { protect } = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const { findNearbyOsm } = require("../services/osmNearby");

const router = express.Router();

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Body bata lat/lng aayo bhane GeoJSON location banaune
const buildServiceData = (body) => {
  const { name, type, phone, address, isActive, lat, lng } = body;
  const data = { name, type, phone, address, isActive };

  if (lat !== undefined && lng !== undefined) {
    data.location = {
      type: "Point",
      coordinates: [Number(lng), Number(lat)],
    };
  } else if (body.location?.coordinates) {
    data.location = body.location;
  }

  Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);

  return data;
};

// @route GET /api/emergency-services
// @desc Get all emergency services (optional ?search=&type=&includeInactive=true)
// @access Public
router.get("/", async (req, res) => {
  try {
    const { search, type, includeInactive } = req.query;
    // Admin panel le inactive service pani herna includeInactive=true pathaucha
    // isActive field nabhaeko purano data pani active (false bhae matra lukaune)
    const filter = includeInactive === "true" ? {} : { isActive: { $ne: false } };

    if (type) filter.type = type;

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: regex }, { type: regex }, { address: regex }];
    }

    const services = await EmergencyService.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route GET /api/emergency-services/osm-nearby?lat=&lng=&radius=
// @desc OpenStreetMap bata najik ka aspatal, swasthya sanstha, pharmacy, prahari, damkal (pura Nepal)
// @access Public
router.get("/osm-nearby", async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  // 1-20 km, default 5 km
  const radius = Math.min(Math.max(Number(req.query.radius) || 5000, 1000), 20000);

  // Nepal ra najik ko seema bahira nasodhne
  if (!(lat > 26 && lat < 31 && lng > 80 && lng < 89)) {
    return res.status(400).json({ success: false, message: "Location must be inside Nepal" });
  }

  try {
    const services = await findNearbyOsm(lat, lng, radius);
    res.json({ success: true, radius, services });
  } catch (error) {
    res.status(502).json({ success: false, message: "Map data service is not available right now" });
  }
});

// @route GET /api/emergency-services/nearby?lat=&lng=&distance=
// @desc Get emergency services near a location (distance in meters)
// @access Public
router.get("/nearby", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const distance = Number(req.query.distance) || 5000;

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: "Valid lat and lng are required",
      });
    }

    const services = await EmergencyService.find({
      isActive: { $ne: false },
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: distance,
        },
      },
    });

    res.status(200).json({
      success: true,
      services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route GET /api/emergency-services/:id
// @desc Get single emergency service
// @access Public
router.get("/:id", async (req, res) => {
  try {
    const service = await EmergencyService.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Emergency service not found",
      });
    }

    res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route POST /api/emergency-services
// @desc Create emergency service
// @access Private/Admin
router.post("/", protect, role("admin"), async (req, res) => {
  try {
    const service = await EmergencyService.create(buildServiceData(req.body));

    res.status(201).json({
      success: true,
      service,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// @route PUT /api/emergency-services/:id
// @desc Update emergency service
// @access Private/Admin
router.put("/:id", protect, role("admin"), async (req, res) => {
  try {
    const service = await EmergencyService.findByIdAndUpdate(
      req.params.id,
      buildServiceData(req.body),
      { returnDocument: "after", runValidators: true },
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Emergency service not found",
      });
    }

    res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// @route DELETE /api/emergency-services/:id
// @desc Delete emergency service
// @access Private/Admin
router.delete("/:id", protect, role("admin"), async (req, res) => {
  try {
    const service = await EmergencyService.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Emergency service not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Emergency service deleted successfully",
      id: req.params.id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
