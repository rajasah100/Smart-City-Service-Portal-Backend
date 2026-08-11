const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    ward: {
      type: String,
      // required: true,
    },

    municipality: {
      type: String,
      default: "Kathmandu Metropolitan City",
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },

    attachment: [
      {
        url: String,
        altText: String,
        type: {
          type: String,
          enum: ["image", "pdf"],
        },
      },
    ],

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },

    publishedBy: {
      type: String,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notice", noticeSchema);
