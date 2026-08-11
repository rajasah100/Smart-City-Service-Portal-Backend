const express = require("express");
const Complaint = require("../models/Complaint");
const role = require("../middleware/roleMiddleware");
const { protect } = require("../middleware/authMiddleware");
const generateComplaintId = require("../utils/generateComplaintId");
const {
  uploadMultipleFilesToCloudinary,
  multerMiddleware,
} = require("../config/cloudinaryConfig");
const { departmentProtect } = require("../middleware/departmentAuth");
const { sendPushNotification } = require("../services/notificationService");
const User = require("../models/User");
const Notification = require("../models/Notification");
const {
  MAX_ACCESS_BOUNDARY_RULES_COUNT,
} = require("google-auth-library/build/src/auth/downscopedclient");
const DepartmentNotification = require("../models/departmentNotification");

const router = express.Router();

// @route POST /api/complaints
// @desc Create a new complaint
// @access Private/User
router.post("/", protect, role("user"), multerMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      phone,
      priority,
      department,
      province,
      district,
      municipality,
      ward,
      tole,
      latitude,
      longitude,
    } = req.body;

    if (!title || !description || !department) {
      return res.status(400).json({
        message: "Title, Description and Department are required",
      });
    }

    let uploadedImages = [];

    if (req.files && req.files.length > 0) {
      uploadedImages = await uploadMultipleFilesToCloudinary(req.files);
    }

    const complaintId = await generateComplaintId();

    // Update user's phone if it doesn't exist
    const user = await User.findById(req.user._id);

    if (!user.phone && phone) {
      user.phone = phone;
      await user.save();
    }

    const complaint = new Complaint({
      complaintId,
      title,
      description,
      phone,
      priority,
      department,
      user: req.user._id,

      location: {
        province,
        district,
        municipality,
        ward,
        tole,
        latitude,
        longitude,
      },

      images: uploadedImages,
    });

    await complaint.save();

    // Notification
    await DepartmentNotification.create({
      department: complaint.department,
      title: "New Complaint Received",
      message: `A new complaint (${complaint.complaintId}) has been submitted.`,
      complaint: complaint._id,
    })

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate("user", "name phone email avatar")
      .populate("department", "name email phone");

    res.status(201).json({
      success: true,
      complaint: populatedComplaint,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
});

// @route GET /api/complaints/my
// @desc Get user's complaints
// @access Private/User
router.get("/my", protect, role("user"), async (req, res) => {
  try {
    const complaint = await Complaint.find({ user: req.user._id })
      .populate("user", "name email phone avatar")
      .populate("department")
      .sort({ createdAt: -1 });

    res.json(complaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

// @route GET /api/complaints
// @desc Get all complaints
// @access Private/Admin
router.get("/", protect, role("admin"), async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("user", "name phone email avatar")
      .populate("department", "name email phone address")
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
    });
  }
});

//@route GET /api/complaints/department
//@desc Get complaints for logged in department
//@access Private/Department
router.get("/department", departmentProtect, async (req, res) => {
  try {
    const complaints = await Complaint.find({
      department: req.department._id,
    })
      .populate("user", "name email phone avatar")
      .populate("department", "name email phone address")
      .sort({ createdAt: -1 });

    res.json({
      complaints,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
});

// status change (update)
router.put("/:id/status", departmentProtect, async (req, res) => {
  try {
    const { status, resolutionNote } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    if (complaint.department.toString() !== req.department._id.toString()) {
      return res.status(403).json({
        message: "Not your complaint",
      });
    }

    complaint.status = status;

    let title = "";
    let body = "";

    switch (status) {
      case "assigned":
        title = "Complaint Assigned";
        body = `Your complaint (Ref: ${complaint.complaintId}) has been assigned to the ${req.department.name}. The department will review your complaint shortly.`;
        break;

      case "in-progress":
        title = "Complaint Under Review";
        body = `The ${req.department.name} has started processing your complaint (Ref: ${complaint.complaintId}).`;
        break;

      case "resolved":
        title = "Complaint Resolved";
        body = `Your complaint (Ref: ${complaint.complaintId}) has been resolved by the ${req.department.name}. Please review the resolution details.`;
        break;

      case "rejected":
        title = "Complaint Rejected";
        body = `Your complaint (Ref: ${complaint.complaintId}) has been rejected by the ${req.department.name}. Please review the rejection reason.`;
        break;

      default:
        title = "Complaint Updated";
        body = `The status of your complaint (Ref: ${complaint.complaintId}) has been updated.`;
    }

    if (status === "resolved" || status === "rejected") {
      if (!resolutionNote?.trim()) {
        return res.status(400).json({
          message: "Resolution note is required",
        });
      }

      complaint.resolutionNote = resolutionNote.trim();
    }

    // If reopened, remove resolved data
    if (status !== "resolved" && status !== "rejected") {
      complaint.resolutionNote = "";
      complaint.resolvedAt = null;
    }

    if (status === "resolved") {
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    // Firebase notification

    const user = await User.findById(complaint.user);

    // save notification in MongoDB
    await Notification.create({
      recipient: complaint.user,
      title,
      message: body,
      type: "complaint",
      complaintId: complaint._id,
      department: complaint.department,
      status,
      resolutionNote: complaint.resolutionNote,
      referenceId: complaint._id,
      route: `/user/complaints/${complaint.complaintId}`
    });

    // Send Firebase push Notification
    if (user?.fcmToken) {
      try {
        await sendPushNotification({
          token: user.fcmToken,
          title,
          body,
          data: {
            complaintId: complaint._id.toString(),
            status,
            type: "complaint",
          },
        });
      } catch (error) {
        console.error("Push notification failed:", error.message);
      }
    }

    const updatedComplaint = await Complaint.findById(complaint._id)
      .populate("user", "name email phone")
      .populate("department", "name email phone address");

    res.status(200).json({
      success: true,
      message: "Complaint status updated successfully",
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
});

// @route GET /api/complaints/track/:complaintId
// @desc Track complaint by complaintId
// @access Private/User

router.get("/track/:complaintId", protect, role("user"), async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      complaintId: req.params.complaintId,
      user: req.user._id,
    })
      .populate("user", "name email phone avatar")
      .populate("department", "name email phone address");

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    res.status(200).json({
      success: true,
      complaint,
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
