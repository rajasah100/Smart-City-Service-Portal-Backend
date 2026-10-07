const express = require("express");
const { Official, Slide, Document } = require("../models/HomeContent");
const { protect } = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  cloudinary,
  contentUpload,
  uploadFileToCloudinary,
} = require("../config/cloudinaryConfig");

const isImage = (file) => file.mimetype.startsWith("image/");
const isPdf = (file) => file.mimetype === "application/pdf";

const removeFromCloudinary = async (file) => {
  if (!file?.publicId) return;

  await cloudinary.uploader
    .destroy(file.publicId, { resource_type: file.resourceType || "image" })
    .catch(() => {});
};

// Admin le CRUD garne sajha router (janapratinidhi, slider, download)
// fields: body bata line field, fileField: model ma file rakhne field, accept: kasto file chalcha
const makeContentRouter = ({ Model, fields, fileField, accept, requireFile }) => {
  const router = express.Router();

  const pick = (body) => {
    const data = {};

    fields.forEach((field) => {
      if (body[field] === undefined) return;

      if (field === "order") data.order = Number(body.order) || 0;
      else if (field === "isActive") data.isActive = String(body.isActive) === "true";
      else data[field] = String(body[field]).trim();
    });

    return data;
  };

  const uploadIfAny = async (req) => {
    if (!req.file) return null;

    if (!accept(req.file)) {
      const error = new Error("This file type is not allowed");
      error.status = 400;
      throw error;
    }

    const uploaded = await uploadFileToCloudinary(req.file);

    return {
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      resourceType: uploaded.resource_type,
      format: uploaded.format || (isPdf(req.file) ? "pdf" : ""),
    };
  };

  // Public: active item matra. Admin le ?all=true le sabai herna sakcha
  router.get("/", async (req, res) => {
    try {
      const filter = req.query.all === "true" ? {} : { isActive: true };

      if (req.query.category) filter.category = req.query.category;

      const items = await Model.find(filter).sort({ order: 1, createdAt: -1 });

      res.status(200).json({ success: true, items });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  router.post("/", protect, role("admin"), contentUpload, async (req, res) => {
    try {
      const data = pick(req.body);
      const file = await uploadIfAny(req);

      if (requireFile && !file) {
        return res.status(400).json({ message: "File is required" });
      }

      if (file) data[fileField] = file;

      const item = await Model.create(data);

      res.status(201).json({ success: true, item });
    } catch (error) {
      res.status(error.status || 400).json({ message: error.message });
    }
  });

  router.put("/:id", protect, role("admin"), contentUpload, async (req, res) => {
    try {
      const item = await Model.findById(req.params.id);

      if (!item) return res.status(404).json({ message: "Not found" });

      Object.assign(item, pick(req.body));

      const file = await uploadIfAny(req);

      if (file) {
        await removeFromCloudinary(item[fileField]);
        item[fileField] = file;
      }

      await item.save();

      res.status(200).json({ success: true, item });
    } catch (error) {
      res.status(error.status || 400).json({ message: error.message });
    }
  });

  router.delete("/:id", protect, role("admin"), async (req, res) => {
    try {
      const item = await Model.findByIdAndDelete(req.params.id);

      if (!item) return res.status(404).json({ message: "Not found" });

      await removeFromCloudinary(item[fileField]);

      res.status(200).json({ success: true, id: req.params.id });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  return router;
};

const officialRoutes = makeContentRouter({
  Model: Official,
  fields: ["nameNe", "nameEn", "designationNe", "designationEn", "phone", "email", "order", "isActive"],
  fileField: "photo",
  accept: isImage,
});

const slideRoutes = makeContentRouter({
  Model: Slide,
  fields: ["titleNe", "titleEn", "textNe", "textEn", "link", "order", "isActive"],
  fileField: "image",
  accept: isImage,
  requireFile: true,
});

const documentRoutes = makeContentRouter({
  Model: Document,
  fields: ["titleNe", "titleEn", "category", "order", "isActive"],
  fileField: "file",
  accept: (file) => isPdf(file) || isImage(file),
  requireFile: true,
});

module.exports = { officialRoutes, slideRoutes, documentRoutes };
