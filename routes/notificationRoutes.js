const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");
const role = require("../middleware/roleMiddleware")

const router = express.Router();

// @route GET /api/notifications
// @desc GET logged-in user's notification
// @access Private/User
router.get("/", protect, role("user"), async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
    }).populate("department", "name").populate("complaintId", "complaintId title").sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route PUT /api/notifications/:id/read
// @desc Mark notification as read
// @access Private/User
router.put("/:id/read", protect, role("user"), async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.isRead = true;

    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route PUT /api/notifications/read-all
// @desc Mark all notifications as read
// @access Private/User
router.put("/read-all", protect, role("user"), async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true },
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route DELETE /api/notifications/:id
// @desc Delete notification
// @access Private/User
router.delete("/:id", protect, role("user"), async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


module.exports = router;
