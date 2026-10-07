const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const noticeRoutes = require("./routes/noticeRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const departmentRoutes = require("./routes/departmentRoute");
const notificationRoutes = require("./routes/notificationRoutes");
const departmentNotificationRoutes = require("./routes/departmentNotificationRoutes");
const aiRoutes = require("./routes/aiRoutes");
const eventRoutes = require("./routes/eventRoutes")
const eventRegistrationRoutes = require("./routes/eventRegistrationRoutes");
const emergencyServiceRoutes = require("./routes/emergencyServiceRoutes");
const sosRoutes = require("./routes/sosRoutes");
const settingRoutes = require("./routes/settingRoutes");
const contactRoutes = require("./routes/contactRoutes");
const { officialRoutes, slideRoutes, documentRoutes } = require("./routes/homeContentRoutes");
const { startSosReminderJob } = require("./services/sosAlertService");

dotenv.config();
const app = express();

// Vercel proxy pachadi chalne bhaeko le (rate limit le sahi IP paos bhanera)
app.set("trust proxy", 1);

app.use(express.json());

// FRONTEND_URL ma comma le chhuttayera dherai URL rakhna milcha
// e.g. FRONTEND_URL=https://smartcity.vercel.app,http://localhost:5173
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  }),
);

const PORT = process.env.PORT || 3000;

// MongoDB connection
connectDB();

// Respond nabhaeko SOS ko reminder (har minute check)
startSosReminderJob();

app.get("/", (req, res) => {
  res.send("Smart City Service Portal API is running");
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/department-notifications", departmentNotificationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/event-registrations", eventRegistrationRoutes);
app.use("/api/emergency-services", emergencyServiceRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/officials", officialRoutes);
app.use("/api/slides", slideRoutes);
app.use("/api/documents", documentRoutes);

// Export for Vercel
module.exports = app;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
