const express = require("express");
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

module.exports = router;
