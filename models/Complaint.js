const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
    },

    phone: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      province: String,
      district: String,
      municipality: String,
      ward: String,
      tole: String,
      latitude: Number,
      longitude: Number,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    images: [
      {
        url: String,
        publicId: String,
        altText: String,
      },
    ],

    resolutionNote: {
      type: String,
      default: "",
    },

    resolvedAt: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["pending", "assigned", "in-progress", "resolved", "rejected"],
      default: "pending",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Complaint", complaintSchema);
