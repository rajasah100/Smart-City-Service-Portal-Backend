const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    currentParticipants: {
      type: Number,
      default: 0,
    },

    maxParticipants: {
      type: Number,
      default: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    category: {
      type: String,
      enum: [
        "Health Camp",
        "Blood Donation",
        "Agriculture",
        "Training",
        "Meeting",
        "Festival",
        "Sports",
        "Education",
        "Culture",
        "Environment",
        "Other",
      ],
      default: "Other",
    },

    image: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
      altText: {
        type: String,
        default: "",
      },
    },

    location: {
      province: {
        type: String,
        trim: true,
      },
      district: {
        type: String,
        trim: true,
      },
      municipality: {
        type: String,
        trim: true,
      },
      ward: {
        type: String,
        trim: true,
      },
      tole: {
        type: String,
        trim: true,
      },
      venue: {
        type: String,
        trim: true,
      },
    },

    organizer: {
      type: String,
      required: true,
      trim: true,
    },

    contact: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },

    startDate: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    isRegistrationRequired: {
      type: Boolean,
      default: false,
    },

    // Admin can manually cancel an event
    isCancelled: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Event", eventSchema);
