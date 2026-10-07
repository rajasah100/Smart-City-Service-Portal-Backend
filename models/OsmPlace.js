const mongoose = require("mongoose");

// OpenStreetMap bata import gareko aapatkalin/swasthya sthaan (pura Nepal).
// Admin ko EmergencyService bhanda chhuttai: script le pheri import garda yo matra badalinchha.
const osmPlaceSchema = new mongoose.Schema(
  {
    osmId: { type: String, required: true, unique: true }, // "node/123"
    name: { type: String, required: true, trim: true },
    nameNe: { type: String, default: "", trim: true },
    type: {
      type: String,
      enum: ["hospital", "clinic", "pharmacy", "police", "traffic", "fire", "ambulance", "other"],
      default: "other",
    },
    phone: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    province: { type: String, default: "" },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    importedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

osmPlaceSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("OsmPlace", osmPlaceSchema);
