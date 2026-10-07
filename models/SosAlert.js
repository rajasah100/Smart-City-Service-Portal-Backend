const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number, default: null },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const sosAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["medical", "fire", "police", "accident", "disaster", "other"],
      default: "other",
    },

    message: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    // Pachhillo (live) location
    location: {
      type: pointSchema,
      required: true,
    },

    // Location ko history (map ma bato dekhauna). Dherai thulo nahos bhanera route ma limit gariyeko cha
    path: {
      type: [pointSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["active", "responding", "resolved", "cancelled"],
      default: "active",
      index: true,
    },

    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    responderName: {
      type: String,
      default: "",
    },

    responseNote: {
      type: String,
      default: "",
      trim: true,
    },

    respondedAt: Date,
    closedAt: Date,

    // Department/admin lai kati patak alert pathaiyo (reminder ko lagi)
    alertCount: {
      type: Number,
      default: 0,
    },
    lastAlertAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("SosAlert", sosAlertSchema);
