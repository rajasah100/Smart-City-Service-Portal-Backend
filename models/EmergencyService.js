const mongoose = require("mongoose");

const emergencyServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["police", "fire", "ambulance", "hospital", "traffic", "other"],
      default: "other",
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    // GeoJSON Point: coordinates = [lng, lat]
    // Koordinat bhae matra location save hunchha (route le type: "Point" aafai rakhchha).
    // Default "Point" rakhda koordinat binako { type: "Point" } le 2dsphere index fail garthyo
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        default: undefined,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

emergencyServiceSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("EmergencyService", emergencyServiceSchema);
