const express = require("express");
const jwt = require("jsonwebtoken");
const Department = require("../models/Department");
const { protect } = require("../middleware/authMiddleware");
const dotenv = require("dotenv");
const role = require("../middleware/roleMiddleware");
const { departmentProtect } = require("../middleware/departmentAuth");

dotenv.config();

const router = express.Router();

// @route POST /api/departments/register
// @desc Create/Register Department
// @access Private/Admin
router.post("/register", protect, role("admin"), async (req, res) => {
  try {
    const { name, email, password, phone, address, description } = req.body;

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
// @desc Get all departments
// @access Public

router.get("/", async (req, res) => {
  try {
    const departments = await Department.find().select("-password");

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

// @route POST /api/departments/logout
// @desc Department Logout
// @access Private

router.post("/logout", departmentProtect, async (req, res) => {
  try {
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
