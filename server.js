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

dotenv.config();
const app = express();
app.use(express.json());

app.use(cors());

const PORT = process.env.PORT || 3000;

// MongoDB connection
connectDB();

app.get("/", (req, res) => {
  res.send("Welcom back Dipesh and Suraj");
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

// Export for Vercel
module.exports = app;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
