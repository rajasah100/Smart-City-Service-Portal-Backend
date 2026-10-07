const mongoose = require("mongoose");
const express = require("express");
const Notice = require("../models/Notice");
const { departmentProtect } = require("../middleware/departmentAuth");
const Department = require("../models/Department");
const { protect } = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  uploadFileToCloudinary,
  noticeUpload,
} = require("../config/cloudinaryConfig");

const router = express.Router();

// @route POST /api/notices
// @desc Create a new Notice
// @access Private/Department
router.post("/", departmentProtect, noticeUpload, async (req, res) => {
  try {
    const { title, description, municipality, ward, priority, category } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        message: "Title and description are required",
      });
    }

    let attachments = [];

    if (req.file) {
      const upload = await uploadFileToCloudinary(req.file);

      // console.log(upload);

      attachments.push({
        url: upload.secure_url,
        altText: "Notice attachment",
        type: req.file.mimetype === "application/pdf" ? "pdf" : "image",
      });
    }

    const notice = await Notice.create({
      title,
      description,
      ward,
      municipality,
      priority,
      category,
      attachment: attachments,

      // Automatically set from logged-in department
      department: req.department._id,
      createdBy: req.department._id,
      publishedBy: req.department.name,

      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Notice created successfully",
      notice,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// @route PUT /api/notices/:id
// @desc Update an existing notice ID
// @access Private/Admin
router.put("/:id", departmentProtect, noticeUpload, async (req, res) => {
  try {
    const {
      title,
      description,
      department,
      ward,
      municipality,
      attachment,
      priority,
      status,
      category,
    } = req.body;

    // Find notice by ID
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({
        message: "Notice not found",
      });
    }

    // Check ownership
    if (notice.department.toString() !== req.department._id.toString()) {
      return res.status(403).json({
        message: "Not your notice",
      });
    }

    // update attachment if new file uploaded
    if (req.file) {
      const upload = await uploadFileToCloudinary(req.file);

      notice.attachment = [
        {
          url: upload.secure_url,
          altText: "Updated notice attachment",
          type: req.file.mimetype === "application/pdf" ? "pdf" : "image",
        },
      ];
    }

    notice.title = title || notice.title;

    notice.description = description || notice.description;

    notice.ward = ward || notice.ward;

    notice.municipality = municipality || notice.municipality;

    notice.priority = priority || notice.priority;

    notice.category = category || notice.category;

    notice.status = status || notice.status;

    // Save the updated notice
    const updatedNotice = await notice.save();
    res.json(updatedNotice);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// @route DELETE /api/notices/:id
// @desc Delete a notice by ID
// @access Private/Admin
router.delete("/:id", departmentProtect, async (req, res) => {
  try {
    // Find the notice by ID
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({
        message: "Notice not found",
      });
    }

    // Check Department
    if (notice.department.toString() !== req.department._id.toString()) {
      return res.status(403).json({
        message: "Nout your Notice",
      });
    }

    await notice.deleteOne();

    res.json({
      message: "Notice Removed",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// @route GET /api/notices
// @desc Get all notices with optional query filters
// @access Public
router.get("/", async (req, res) => {
  try {
    const { municipality, department, priority, search, category, limit } = req.query;

    let query = {};

    // Municipality
    if (municipality) {
      query.municipality = municipality;
    }

    // Department (ID wa naam dubai chalcha; notice page le ID pathaucha)
    if (department) {
      const dept = mongoose.isValidObjectId(department)
        ? await Department.findById(department)
        : await Department.findOne({ name: department });

      if (dept) {
        query.department = dept._id;
      } else {
        return res.json([]);
      }
    }

    // Priority
    if (priority) {
      query.priority = priority;
    }

    // Category (purano notice ma category nabhae "notice" manne)
    if (category === "notice") {
      query.category = { $in: ["notice", null] };
    } else if (category) {
      query.category = category;
    }

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Search
    if (search && search.trim() !== "") {
      const safeSearch = escapeRegex(search.trim());

      query.$or = [
        {
          title: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          description: {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    const notices = await Notice.find(query)
      .populate("department", "name")
      .populate("createdBy")
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 0, 100));

    res.json(notices);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// @route GET /api/notices/new-arrivals
// @desc Retrieve latest 4 notices - Creation date
// @access Public
router.get("/new-arrivals", async (req, res) => {
  try {
    // Fetch latest 4 notices
    const newArrivals = await Notice.find()
      .populate("department", "name")
      .sort({ createdAt: -1 })
      .limit(4);
    res.json(newArrivals);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// GET /api/notices/department
router.get("/department/my", departmentProtect, async (req, res) => {
  try {
    const notices = await Notice.find({
      department: req.department._id,
    })
      .sort({ createdAt: -1 })
      .populate("department", "name");

    res.status(200).json({
      success: true,
      notices,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// GET /api/admin/notices
//desc get all notices
// access private / Admin
router.get("/all", protect, role("admin"), async (req, res) => {
  try {
    const notices = await Notice.find()
      .populate("department", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      notices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// @route GET /api/notices/:id
// @desc Get a single notice by ID
// @access Public
router.get("/:id", async (req, res) => {
  try {
    // Galat ID ma 500 haina, 404 pathaune
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Notice Not Found" });
    }

    // Public page ma chahine department ko jankari matra
    const notice = await Notice.findById(req.params.id)
      .populate("department", "name phone email address")
      .populate("createdBy", "name");
    if (notice) {
      res.json(notice);
    } else {
      res.status(404).json({ message: "Notice Not Found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
