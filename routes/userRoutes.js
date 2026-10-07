const express = require("express");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const { sendEmail } = require("../services/emailService");
const jwt = require("jsonwebtoken");
const { protect } = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const { OAuth2Client } = require("google-auth-library");
const {
  avatarUpload,
  uploadFileToCloudinary,
} = require("../config/cloudinaryConfig");

const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Login / register / forgot-password ma brute-force rokne
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again after 15 minutes." },
});

// @route GET /api/users
// @desc Get all users
// @access Private/Admin
router.get("/", protect, role("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route POST /api/users/register
// @desc Register a new user
// @access public

router.post("/register", authLimiter, async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    // Registration Logic

    let user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "User already exists" });

    user = new User({ name, email, password, phone });
    await user.save();

    // Create JWT Payload
    const payload = {
      user: { id: user._id, role: user.role, department: user.department },
    };

    // Sign and return the token along with user data
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "40h",
    });

    // send the user and token in response
    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
      },
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});

// @route POST /api/users/login
// @desc Authenticate user
// @access Public

router.post("/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the uesr by email
    let user = await User.findOne({ email });

    // Google bata register bhaeko user ko password hudaina
    if (!user || !user.password)
      return res.status(400).json({ message: "Invalid Credentials" });

    const isMatch = await user.matchPassword(password);

    if (!isMatch)
      return res.status(400).json({ message: "Invalid Credentials" });

    // Create JWT Payload
    const payload = {
      user: { id: user._id, role: user.role, department: user.department },
    };

    // Sign and return the token along with user data
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "40h",
    });

    // send the user and token in response
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// @route GET /api/users/profile
// @desc GET logged-in user's profile (Protected Route)
// @access Private

router.get("/profile", protect, async (req, res) => {
  // Google account ma password hudaina (settings page le "purano password" magne ki nai thaha paos)
  const hasPassword = !!(await User.exists({
    _id: req.user._id,
    password: { $exists: true, $nin: [null, ""] },
  }));

  res.json({ ...req.user.toObject(), hasPassword });
});

// @route PUT /api/users/profile
// @desc Update logged in user profile
// @access Private

router.put("/profile", protect, avatarUpload, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please select an image",
      });
    }

    const result = await uploadFileToCloudinary(req.file);

    user.avatar = result.secure_url;
    // console.log(user.password);

    await user.save();

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
      },
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message,
    });
  }
});

// @route PUT /api/users/change-password
// @desc Change Password
// @access Private

router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Google bata khuleko account ma purano password hudaina: sidhai naya password set garna dine
    if (user.password) {
      const isMatch = await user.matchPassword(currentPassword || "");

      if (!isMatch) {
        return res.status(400).json({
          message: "Current password is incorrect",
        });
      }
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    user.password = newPassword;

    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// Google Login
router.post("/google", async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const { email, name, picture, sub } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        phone: "",
        avatar: picture,
        googleId: sub,
        password: Math.random().toString(36),
      });
    }

    const jwtToken = jwt.sign(
      {
        user: {
          id: user._id,
          role: user.role,
        },
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "40h",
      },
    );

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        role: user.role,
      },
      token: jwtToken,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Google login failed",
    });
  }
});

// @route PUT /api/users/fcm-token
// @desc Save Firebase Cloud Messaging Token
// @access Private
router.put("/fcm-token", protect, async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: "FCM Token is required",
      });
    }

    await User.findByIdAndUpdate(
      req.user._id,
      {
        fcmToken,
      },
      {
        new: true,
      },
    );

    res.status(200).json({
      success: true,
      message: "FCM Token saved successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route POST /api/users/forgot-password
// @desc Send password reset link to email
// @access Public
router.post("/forgot-password", authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const genericMessage =
      "If an account exists with this email, a reset link has been sent.";

    const user = await User.findOne({ email: email.trim() });

    // Email cha ki chaina bhanera reveal nagarne
    if (!user) {
      return res.status(200).json({ success: true, message: genericMessage });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

    await user.save({ validateBeforeSave: false });

    const frontendUrl = (process.env.FRONTEND_URL || "")
      .split(",")[0]
      .trim()
      .replace(/\/$/, "");
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your password - Smart City Service Portal",
        html: `
          <p>Hello ${user.name},</p>
          <p>You requested to reset your password. Click the link below to set a new password:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link will expire in 15 minutes. If you did not request this, please ignore this email.</p>
        `,
      });
    } catch (mailError) {
      console.error(mailError);

      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        message: "Failed to send email. Please try again later.",
      });
    }

    res.status(200).json({ success: true, message: genericMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// @route PUT /api/users/reset-password/:token
// @desc Reset password using token from email
// @access Public
router.put("/reset-password/:token", authLimiter, async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Reset link is invalid or has expired" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful. Please login.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// @route DELETE /api/users/:id
// @desc Delete a user
// @access Private/Admin
router.delete("/:id", protect, role("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be deleted",
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      id: req.params.id,
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
