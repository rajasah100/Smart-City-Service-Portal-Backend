const express = require("express");
const mongoose = require("mongoose");
const { departmentProtect } = require("../middleware/departmentAuth");
const Department = require("../models/Department");
const DepartmentNotification = require("../models/departmentNotification");

const router = express.Router();

// Get Department Notification
router.get("/", departmentProtect, async (req, res) => {
  try {
    const notifications = await DepartmentNotification.find({
      department: req.department._id,
    })
      .populate("complaint", "complaintId title priority status")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Failed",
    });
  }
});



// Mark All Notifications as Read
router.put("/read-all", departmentProtect, async (req, res) => {
  try {
    await DepartmentNotification.updateMany(
      {
        department: req.department._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      },
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Ek notification padhieko banaune (aphno department ko matra)
router.put("/:id/read", departmentProtect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    const notification = await DepartmentNotification.findOneAndUpdate(
      { _id: req.params.id, department: req.department._id },
      { isRead: true },
      { returnDocument: "after" },
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
