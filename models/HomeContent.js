const mongoose = require("mongoose");

// Cloudinary ma rakhiyeko file
const fileSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
    resourceType: { type: String, default: "image" },
    format: { type: String, default: "" },
  },
  { _id: false },
);

// Janapratinidhi / karmachari (Home page ma photo sahit)
const officialSchema = new mongoose.Schema(
  {
    nameNe: { type: String, required: true, trim: true },
    nameEn: { type: String, default: "", trim: true },
    designationNe: { type: String, required: true, trim: true },
    designationEn: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true },
    photo: { type: fileSchema, default: () => ({}) },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Home page slider ko photo
const slideSchema = new mongoose.Schema(
  {
    titleNe: { type: String, required: true, trim: true },
    titleEn: { type: String, default: "", trim: true },
    textNe: { type: String, default: "", trim: true },
    textEn: { type: String, default: "", trim: true },
    link: { type: String, default: "", trim: true },
    image: { type: fileSchema, default: () => ({}) },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Download garna milne kagajat (ain, niyam, form...)
const documentSchema = new mongoose.Schema(
  {
    titleNe: { type: String, required: true, trim: true },
    titleEn: { type: String, default: "", trim: true },
    category: {
      type: String,
      enum: ["act", "regulation", "procedure", "form", "report", "other"],
      default: "other",
    },
    file: { type: fileSchema, default: () => ({}) },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = {
  Official: mongoose.model("Official", officialSchema),
  Slide: mongoose.model("Slide", slideSchema),
  Document: mongoose.model("Document", documentSchema),
};
