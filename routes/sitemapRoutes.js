const express = require("express");
const Notice = require("../models/Notice");
const Event = require("../models/Event");

const router = express.Router();

// Public page (frontend ko route) ra Google lai kati mahatwa
const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/notices", priority: "0.9", changefreq: "daily" },
  { path: "/emergency", priority: "0.9", changefreq: "weekly" },
  { path: "/services", priority: "0.8", changefreq: "monthly" },
  { path: "/events", priority: "0.8", changefreq: "daily" },
  { path: "/about", priority: "0.6", changefreq: "monthly" },
  { path: "/downloads", priority: "0.6", changefreq: "monthly" },
  { path: "/government", priority: "0.5", changefreq: "monthly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
  { path: "/accessibility", priority: "0.3", changefreq: "yearly" },
];

// Live frontend ko domain: SITE_URL, natra FRONTEND_URL madhye localhost bahek ko pahilo
const siteUrl = () => {
  const fromList = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((url) => url.trim())
    .find((url) => url && !url.includes("localhost"));
  return (process.env.SITE_URL || fromList || "http://localhost:5173").replace(/\/$/, "");
};

const escapeXml = (text) => String(text).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);

const urlEntry = ({ loc, lastmod, changefreq, priority }) =>
  `  <url>\n    <loc>${escapeXml(loc)}</loc>\n${lastmod ? `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>\n` : ""}    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

// @route GET /api/sitemap.xml
// @desc Google/Bing ko lagi sitemap (static page + sakriya suchana + karyakram)
// @access Public
router.get("/", async (req, res) => {
  try {
    const base = siteUrl();
    const [notices, events] = await Promise.all([
      Notice.find({ status: "active" }).select("_id updatedAt createdAt").sort({ createdAt: -1 }).limit(5000).lean(),
      Event.find({ isCancelled: { $ne: true } }).select("_id updatedAt createdAt").sort({ startDate: -1 }).limit(5000).lean(),
    ]);

    const entries = [
      ...STATIC_PAGES.map((page) => urlEntry({ loc: `${base}${page.path}`, changefreq: page.changefreq, priority: page.priority })),
      ...notices.map((n) => urlEntry({ loc: `${base}/notices/${n._id}`, lastmod: n.updatedAt || n.createdAt, changefreq: "weekly", priority: "0.7" })),
      ...events.map((e) => urlEntry({ loc: `${base}/events/${e._id}`, lastmod: e.updatedAt || e.createdAt, changefreq: "weekly", priority: "0.7" })),
    ];

    res
      .set("Content-Type", "application/xml; charset=utf-8")
      .set("Cache-Control", "public, max-age=3600")
      .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`);
  } catch (error) {
    console.error("Sitemap error:", error.message);
    res.status(500).set("Content-Type", "text/plain").send("Sitemap is not available");
  }
});

module.exports = router;
