// AI assistant le pryog garne tool: sabai data database bata (AI le aafai nabanaos)
const mongoose = require("mongoose");
const Notice = require("../models/Notice");
const Department = require("../models/Department");
const EmergencyService = require("../models/EmergencyService");
const Event = require("../models/Event");
const Complaint = require("../models/Complaint");
const SiteSetting = require("../models/SiteSetting");

// Rastriya aapatkalin number (sadhai sahi, AI le jawaf ma pryog garna)
const NATIONAL_HOTLINES = [
  { name: "Nepal Police", phone: "100" },
  { name: "Fire Brigade", phone: "101" },
  { name: "Ambulance", phone: "102" },
  { name: "Traffic Police", phone: "103" },
  { name: "Child Helpline", phone: "1098" },
  { name: "Tourist Police", phone: "1144" },
  { name: "Women Helpline", phone: "1145" },
];

// AI le kholna milne page (frontend ko route)
const PAGES = {
  complaint: "/complaint",
  my_complaints: "/user/complaints",
  emergency: "/emergency",
  notices: "/notices",
  events: "/events",
  services: "/services",
  about: "/about",
  login: "/login",
  register: "/register",
};

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const short = (text = "", max = 300) => (text.length > max ? `${text.slice(0, max)}…` : text);

const areaText = (area = {}) => {
  if (!area.province) return "All of Nepal";
  if (!area.district) return `Whole ${area.province}`;
  if (!area.municipalities?.length) return `Whole ${area.district} district (${area.province})`;
  return `${area.district}: ${area.municipalities.join(", ")}`;
};

// ===== Tool haru =====
const tools = {
  async get_notices({ limit = 5, category } = {}) {
    const filter = { status: "active" };
    if (["notice", "tender", "news", "press"].includes(category)) filter.category = category;

    const notices = await Notice.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 5, 10))
      .populate("department", "name")
      .lean();

    return {
      notices: notices.map((n) => ({
        id: String(n._id),
        title: n.title,
        summary: short(n.description, 250),
        category: n.category,
        priority: n.priority,
        department: n.department?.name,
        place: [n.municipality, n.ward && `ward ${n.ward}`].filter(Boolean).join(", "),
        date: n.createdAt,
        link: `/notices/${n._id}`,
      })),
    };
  },

  async get_departments() {
    const departments = await Department.find({ isActive: { $ne: false } })
      .select("name phone email address description serviceArea")
      .sort({ name: 1 })
      .lean();

    return {
      departments: departments.map((d) => ({
        id: String(d._id),
        name: d.name,
        phone: d.phone,
        email: d.email,
        office: d.address,
        serviceArea: areaText(d.serviceArea),
        about: short(d.description, 200),
      })),
    };
  },

  async get_emergency_contacts({ place, type } = {}) {
    const filter = { isActive: { $ne: false } };
    if (place) filter.$or = [{ address: new RegExp(escapeRegex(place), "i") }, { name: new RegExp(escapeRegex(place), "i") }];
    if (type) filter.type = new RegExp(escapeRegex(type), "i");

    const services = place || type ? await EmergencyService.find(filter).limit(12).lean() : [];

    return {
      nationalHotlines: NATIONAL_HOTLINES,
      localServices: services.map((s) => ({ name: s.name, type: s.type, phone: s.phone, address: s.address })),
      note: "National hotlines work from any phone in Nepal. For nearest places on a map, open the Emergency page.",
    };
  },

  async get_upcoming_events({ limit = 5 } = {}) {
    const events = await Event.find({ isCancelled: { $ne: true }, endDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } })
      .sort({ startDate: 1 })
      .limit(Math.min(Number(limit) || 5, 10))
      .lean();

    return {
      events: events.map((e) => ({
        title: e.title,
        category: e.category,
        date: e.startDate,
        time: `${e.startTime} - ${e.endTime}`,
        venue: [e.location?.venue, e.location?.municipality, e.location?.district].filter(Boolean).join(", "),
        registrationRequired: e.isRegistrationRequired,
        link: `/events/${e._id}`,
      })),
    };
  },

  async get_my_complaints(_, { user }) {
    if (!user) return { error: "LOGIN_REQUIRED", message: "The citizen must log in to see their complaints." };

    const complaints = await Complaint.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("department", "name")
      .lean();

    return {
      complaints: complaints.map((c) => ({
        complaintId: c.complaintId,
        title: c.title,
        status: c.status,
        department: c.department?.name,
        submitted: c.createdAt,
        note: c.resolutionNote || undefined,
      })),
    };
  },

  async track_complaint({ complaintId } = {}, { user }) {
    if (!user) return { error: "LOGIN_REQUIRED", message: "The citizen must log in to track a complaint." };
    if (!complaintId) return { error: "MISSING_ID" };

    const complaint = await Complaint.findOne({ complaintId: String(complaintId).trim().toUpperCase() })
      .populate("department", "name phone")
      .lean();

    // Aafno gunaso matra (admin le sabai)
    if (!complaint || (String(complaint.user) !== String(user._id) && user.role !== "admin")) {
      return { error: "NOT_FOUND", message: "No complaint with this registration number was found for this account." };
    }

    return {
      complaintId: complaint.complaintId,
      title: complaint.title,
      status: complaint.status,
      priority: complaint.priority,
      department: complaint.department?.name,
      departmentPhone: complaint.department?.phone,
      submitted: complaint.createdAt,
      lastUpdated: complaint.updatedAt,
      note: complaint.resolutionNote || undefined,
      link: `/user/complaints/${complaint.complaintId}`,
    };
  },

  async get_portal_info() {
    const s = (await SiteSetting.findOne().lean()) || {};
    return {
      nameNe: s.nameNe || "स्मार्ट सिटी सेवा पोर्टल",
      nameEn: s.nameEn || "Smart City Service Portal",
      addressNe: s.addressNe,
      addressEn: s.addressEn,
      phone: s.phone || undefined,
      email: s.email || undefined,
      hotline: s.hotline,
      officeHoursNe: s.officeHoursNe,
      officeHoursEn: s.officeHoursEn,
    };
  },

  // Gunaso form ko lagi draft: frontend ma "form kholne" button bancha
  async draft_complaint({ departmentId, title, description, priority } = {}, { actions }) {
    const department = mongoose.isValidObjectId(departmentId)
      ? await Department.findOne({ _id: departmentId, isActive: { $ne: false } }).select("name").lean()
      : null;

    const draft = {
      department: department ? String(department._id) : "",
      departmentName: department?.name || "",
      title: short(String(title || "").trim(), 120),
      description: short(String(description || "").trim(), 500),
      priority: ["low", "medium", "high"].includes(priority) ? priority : "medium",
    };

    actions.push({ type: "draft_complaint", data: draft });
    return { ok: true, draft, note: "A button to open the pre-filled complaint form is shown to the citizen. They still choose the location and photos, then submit." };
  },

  async open_page({ page } = {}, { actions }) {
    if (!PAGES[page]) return { error: "UNKNOWN_PAGE", pages: Object.keys(PAGES) };
    if (!actions.some((a) => a.type === "open_page" && a.page === page)) actions.push({ type: "open_page", page, path: PAGES[page] });
    return { ok: true };
  },
};

// OpenAI/Groq function schema
const toolDefinitions = [
  {
    name: "get_notices",
    description: "Latest active notices published on the portal (service interruptions, tenders, news).",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "integer", description: "How many (1-10). Default 5." },
        category: { type: "string", enum: ["notice", "tender", "news", "press"] },
      },
    },
  },
  {
    name: "get_departments",
    description: "All active departments with phone, email, office and the area they serve. Use to answer who handles a problem in a place, or before drafting a complaint.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_emergency_contacts",
    description: "National emergency hotlines, plus saved hospitals/police/fire stations matching a place name (district or city) and/or type.",
    parameters: {
      type: "object",
      properties: {
        place: { type: "string", description: "City or district in English, e.g. Biratnagar, Kathmandu, Bhaktapur." },
        type: { type: "string", description: "hospital, police, fire, ambulance, traffic" },
      },
    },
  },
  {
    name: "get_upcoming_events",
    description: "Upcoming public events and programs (health camps, trainings, etc.).",
    parameters: { type: "object", properties: { limit: { type: "integer" } } },
  },
  {
    name: "get_my_complaints",
    description: "The logged-in citizen's latest complaints and their status.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "track_complaint",
    description: "Status of one complaint by its registration number (e.g. SCP-2026-1791321564212). Only the citizen's own complaints.",
    parameters: {
      type: "object",
      properties: { complaintId: { type: "string" } },
      required: ["complaintId"],
    },
  },
  {
    name: "get_portal_info",
    description: "Portal name, office address, phone, email and office hours.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "draft_complaint",
    description:
      "Prepare a complaint draft when the citizen describes a civic problem (water, electricity, road, waste, transport...). Call get_departments first to pick the right departmentId. Shows a button that opens the complaint form pre-filled.",
    parameters: {
      type: "object",
      properties: {
        departmentId: { type: "string", description: "id from get_departments" },
        title: { type: "string", description: "Short subject, in the citizen's language" },
        description: { type: "string", description: "Clear details from what the citizen said (at least 20 characters)" },
        priority: { type: "string", enum: ["low", "medium", "high"], description: "high only if there is danger to people or property" },
      },
      required: ["title", "description", "priority"],
    },
  },
  {
    name: "open_page",
    description: "Show a button that opens a portal page for the citizen.",
    parameters: {
      type: "object",
      properties: { page: { type: "string", enum: Object.keys(PAGES) } },
      required: ["page"],
    },
  },
].map((fn) => ({ type: "function", function: fn }));

// Tool chalaune (galti bhae AI lai error nai pathaune)
const runTool = async (name, args, context) => {
  const tool = tools[name];
  if (!tool) return { error: "UNKNOWN_TOOL" };

  try {
    return await tool(args || {}, context);
  } catch (error) {
    console.error(`AI tool ${name} failed:`, error.message);
    return { error: "TOOL_FAILED" };
  }
};

module.exports = { toolDefinitions, runTool, NATIONAL_HOTLINES };
