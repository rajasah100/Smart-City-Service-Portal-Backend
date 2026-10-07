const express = require("express");
const jwt = require("jsonwebtoken");
const Department = require("../models/Department");
const { protect } = require("../middleware/authMiddleware");
const dotenv = require("dotenv");
const role = require("../middleware/roleMiddleware");
const { departmentProtect } = require("../middleware/departmentAuth");
const { cleanServiceArea, coversLocation } = require("../utils/serviceArea");

dotenv.config();

const router = express.Router();

// @route POST /api/departments/register
// @desc Create/Register Department
// @access Private/Admin
router.post("/register", protect, role("admin"), async (req, res) => {
  try {
    const { name, email, password, phone, address, description, serviceArea } = req.body;

    const existDepartment = await Department.findOne({ email });

    if (existDepartment) {
      return res.status(400).json({
        message: "Department already exists",
      });
    }

    const department = new Department({
      name,
      email,
      password,
      phone,
      address,
      description,
      serviceArea: cleanServiceArea(serviceArea),
      admin: req.user._id,
    });

    await department.save();

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      department: {
        _id: department._id,
        name: department.name,
        email: department.email,
        phone: department.phone,
        address: department.address,
        description: department.description,
        isActive: department.isActive,
        serviceArea: department.serviceArea,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
    });
  }
});

// @route POST /api/departments/login
// @desc Department Login
// @access Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const department = await Department.findOne({ email }).select("+password");

    if (!department) {
      return res.status(400).json({
        message: "Invalid Creadentials",
      });
    }

    if (!department.isActive) {
      return res.status(403).json({
        message: "Department account is inactive",
      });
    }

    const isMatch = await department.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid Creadentials",
      });
    }

    const token = jwt.sign(
      { department: { id: department._id, name: department.name } },
      process.env.JWT_SECRET,
      { expiresIn: "40h" },
    );

    res.json({
      department: {
        _id: department._id,
        name: department.name,
        email: department.email,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
    });
  }
});

// Update Department
router.put("/:id", protect, role("admin"), async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    department.name = req.body.name || department.name;
    department.email = req.body.email || department.email;
    department.phone = req.body.phone || department.phone;
    department.address = req.body.address || department.address;
    department.description = req.body.description || department.description;

    if (req.body.serviceArea) {
      department.serviceArea = cleanServiceArea(req.body.serviceArea);
    }

    if (req.body.password) {
      department.password = req.body.password;
    }

    await department.save();

    res.json({
      success: true,
      message: "Department updated successfully",
      department: {
        _id: department._id,
        name: department.name,
        email: department.email,
        phone: department.phone,
        address: department.address,
        isActive: department.isActive,
        description: department.description,
        serviceArea: department.serviceArea,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// @route GET api/departments/profile
// @desc Get logged in department profile
// @access Private
router.get("/profile", departmentProtect, async (req, res) => {
  res.json(req.department);
});

// @route GET /api/departments
// @desc Get all departments (?province=&district=&municipality= dida tyo thau herne matra)
// @access Public

router.get("/", async (req, res) => {
  try {
    let departments = await Department.find().select("-password");
    const { province, district, municipality } = req.query;

    if (province) {
      departments = departments.filter((department) =>
        coversLocation(department.serviceArea, { province, district, municipality }),
      );
    }

    res.status(200).json({
      success: true,
      departments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route POST /api/departments/fcm-token
// @desc Save push notification token for this device (SOS alert ko lagi)
// @access Private/Department
router.post("/fcm-token", departmentProtect, async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: "FCM Token is required" });
    }

    // Naya token thapne, ani 10 ota bhanda badhi device bhaye purano hataune
    await Department.updateOne(
      { _id: req.department._id },
      { $pull: { fcmTokens: fcmToken } },
    );
    await Department.updateOne(
      { _id: req.department._id },
      { $push: { fcmTokens: { $each: [fcmToken], $slice: -10 } } },
    );

    res.status(200).json({ success: true, message: "FCM Token saved." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route POST /api/departments/logout
// @desc Department Logout
// @access Private

router.post("/logout", departmentProtect, async (req, res) => {
  try {
    // Logout bhaeko device ma SOS notification napathaune
    if (req.body?.fcmToken) {
      await Department.updateOne(
        { _id: req.department._id },
        { $pull: { fcmTokens: req.body.fcmToken } },
      );
    }

    res.status(200).json({
      success: true,
      message: "Department logout successful",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete Department
router.delete("/:id", protect, role("admin"), async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    await department.deleteOne();

    res.json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

module.exports = router;
