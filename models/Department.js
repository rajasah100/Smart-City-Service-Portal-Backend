const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    phone: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    description: {
      type: String,
      default: "",
    },

    // Kun thau ko gunaso herne. Khali province = pura Nepal, khali district = pura pradesh,
    // khali municipalities = pura jilla. Purana department (yo field nabhaeko) Bhaktapur jilla
    serviceArea: {
      province: { type: String, default: "Bagmati Province", trim: true },
      district: { type: String, default: "Bhaktapur", trim: true },
      municipalities: { type: [String], default: [] },
    },

    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Push notification token (dherai device/browser bata login huna sakcha)
    fcmTokens: {
      type: [String],
      default: [],
      select: false,
    },
  },
  { timestamps: true },
);

// Password Hash Middleware

departmentSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(this.password, salt);
});

// Match Department Password

departmentSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Department", departmentSchema);
