const SosAlert = require("../models/SosAlert");
const Department = require("../models/Department");
const User = require("../models/User");
const { sendPushToMany } = require("./notificationService");
const { sendEmail } = require("./emailService");

const TYPE_LABELS = {
  medical: "Medical",
  fire: "Fire",
  police: "Crime / Police",
  accident: "Accident",
  disaster: "Flood / Earthquake",
  other: "Other",
};

const REMINDER_AFTER_MS = 3 * 60 * 1000; // 3 minute samma respond nabhaye
const MAX_ALERTS = 4; // pahilo alert + 3 reminder

const frontendUrl = () =>
  (process.env.FRONTEND_URL || "").split(",")[0].trim().replace(/\/$/, "");

// FCM le https link matra manchha (localhost ma link bina pathaune)
const httpsLink = (path) => {
  const base = frontendUrl();
  return base.startsWith("https://") ? `${base}${path}` : undefined;
};

const escapeHtml = (text = "") =>
  String(text).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[ch]);

// Sabai department ra admin lai push + email
const alertResponders = async (sos, { reminder = false } = {}) => {
  await sos.populate("user", "name phone");

  const typeLabel = TYPE_LABELS[sos.type] || "Emergency";
  const citizen = sos.user?.name || "A citizen";
  const minutes = Math.max(1, Math.round((Date.now() - sos.createdAt) / 60000));

  const title = reminder
    ? `⚠️ SOS still waiting (${minutes} min) - ${typeLabel}`
    : `🆘 New SOS - ${typeLabel}`;

  const body = `${citizen} needs help${sos.message ? `: "${sos.message}"` : "."} Open the SOS dashboard to respond.`;

  const data = { type: "sos", sosId: sos._id };

  const [departments, admins] = await Promise.all([
    Department.find({ isActive: { $ne: false } }).select("+fcmTokens email name"),
    User.find({ role: "admin" }).select("fcmToken email"),
  ]);

  // ---------- Push ----------
  try {
    const deptResult = await sendPushToMany({
      tokens: departments.flatMap((dept) => dept.fcmTokens || []),
      title,
      body,
      link: httpsLink("/department/sos"),
      data,
      urgent: true,
    });

    if (deptResult.invalidTokens.length > 0) {
      await Department.updateMany(
        {},
        { $pull: { fcmTokens: { $in: deptResult.invalidTokens } } },
      );
    }

    const adminResult = await sendPushToMany({
      tokens: admins.map((admin) => admin.fcmToken),
      title,
      body,
      link: httpsLink("/admin/sos"),
      data,
      urgent: true,
    });

    if (adminResult.invalidTokens.length > 0) {
      await User.updateMany(
        { fcmToken: { $in: adminResult.invalidTokens } },
        { $set: { fcmToken: null } },
      );
    }
  } catch (error) {
    console.error("SOS push failed:", error.message);
  }

  // ---------- Email (pahilo alert ma matra) ----------
  if (!reminder && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const recipients = [
      ...departments.map((dept) => dept.email),
      ...admins.map((admin) => admin.email),
    ].filter(Boolean);

    const mapsLink = `https://www.google.com/maps?q=${sos.location.latitude},${sos.location.longitude}`;
    const dashboardLink = `${frontendUrl()}/department/sos`;

    try {
      await sendEmail({
        to: [...new Set(recipients)].join(","),
        subject: `🆘 New SOS - ${typeLabel} - Smart City Service Portal`,
        html: `
          <h2>New SOS received</h2>
          <p><b>Citizen:</b> ${escapeHtml(citizen)}</p>
          <p><b>Phone:</b> ${escapeHtml(sos.phone || sos.user?.phone || "Not provided")}</p>
          <p><b>Type:</b> ${escapeHtml(typeLabel)}</p>
          ${sos.message ? `<p><b>Message:</b> ${escapeHtml(sos.message)}</p>` : ""}
          <p><b>Location:</b> <a href="${mapsLink}">Open in Google Maps</a></p>
          <p><a href="${dashboardLink}">Open SOS dashboard to respond</a></p>
        `,
      });
    } catch (error) {
      console.error("SOS email failed:", error.message);
    }
  }

  sos.alertCount = (sos.alertCount || 0) + 1;
  sos.lastAlertAt = new Date();
  await SosAlert.updateOne(
    { _id: sos._id },
    { $set: { alertCount: sos.alertCount, lastAlertAt: sos.lastAlertAt } },
  );
};

// Respond nabhaeko SOS ko lagi har minute check garne
const startSosReminderJob = () => {
  const timer = setInterval(async () => {
    try {
      const cutoff = new Date(Date.now() - REMINDER_AFTER_MS);

      const waiting = await SosAlert.find({
        status: "active",
        alertCount: { $lt: MAX_ALERTS },
        lastAlertAt: { $lte: cutoff },
      }).select("-path");

      for (const sos of waiting) {
        await alertResponders(sos, { reminder: true });
      }
    } catch (error) {
      console.error("SOS reminder job failed:", error.message);
    }
  }, 60 * 1000);

  timer.unref?.();
};

module.exports = { alertResponders, startSosReminderJob };
