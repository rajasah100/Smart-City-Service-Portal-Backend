// Koshi Province ko namuna data halne. Kehi pani delete gardaina:
// pahile nai bhaeko data (email/title anusar) chhodchha, naya matra thapchha.
// Run:  npm run seed            (database ma halne)
//       npm run seed -- --dry   (database ma nalekhi jaanch matra)
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const User = require("./models/User");
const Department = require("./models/Department");
const Notice = require("./models/Notice");
const Event = require("./models/Event");
const EmergencyService = require("./models/EmergencyService");
const { departments, notices, events, emergencyServices } = require("./data/koshiData");

dotenv.config();

const DRY = process.argv.includes("--dry");
const DEPARTMENT_PASSWORD = "Koshi@123";
const PORTAL_NAME = "स्मार्ट सिटी सेवा पोर्टल";
// Portal le gareko karyakram ko namuna samparka (admin bata badalnus)
const PORTAL_CONTACT = { phone: "9800000100", email: "info.koshi@example.com" };

const count = { created: 0, skipped: 0 };

// Galti bhae seed rokne (dry run ma pani)
const check = async (doc, label) => {
  try {
    await doc.validate();
  } catch (error) {
    throw new Error(`${label}: ${error.message}`);
  }
};

// Pahile nai chha bhane chhodne, natra banaune
const ensure = async (Model, filter, data, label) => {
  const doc = new Model(data);
  await check(doc, label);

  if (DRY) {
    console.log(`  [dry] ${label}`);
    return doc;
  }

  const existing = await Model.findOne(filter);
  if (existing) {
    count.skipped++;
    console.log(`  = ${label} (pahile nai chha)`);
    return existing;
  }

  await doc.save(); // save(): department ko password hash huna
  count.created++;
  console.log(`  + ${label}`);
  return doc;
};

const seed = async () => {
  if (!DRY) await mongoose.connect(process.env.MONGODB_URL);

  // Admin: bhaeko admin pryog garne, nabhae matra banaune
  const admin = DRY
    ? new User({ name: "Admin User", email: "admin@example.com", role: "admin" })
    : (await User.findOne({ role: "admin" })) ||
      (await User.create({ name: "Admin User", email: "admin@example.com", password: "123456", role: "admin" }));

  console.log("Departments:");
  const departmentByKey = {};
  for (const { key, ...data } of departments) {
    departmentByKey[key] = await ensure(
      Department,
      { email: data.email },
      { ...data, password: DEPARTMENT_PASSWORD, admin: admin._id },
      data.name,
    );
  }

  console.log("Notices:");
  for (const { department, ...data } of notices) {
    const owner = departmentByKey[department];
    if (!owner) throw new Error(`Notice "${data.title}": department "${department}" chhaina`);

    await ensure(
      Notice,
      { title: data.title },
      { ...data, department: owner._id, createdBy: owner._id, publishedBy: owner.name, status: "active" },
      data.title,
    );
  }

  console.log("Events:");
  for (const { organizerKey, ...data } of events) {
    const organizer = organizerKey ? departmentByKey[organizerKey] : null;
    if (organizerKey && !organizer) throw new Error(`Event "${data.title}": department "${organizerKey}" chhaina`);

    await ensure(
      Event,
      { title: data.title },
      {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        organizer: organizer?.name || PORTAL_NAME,
        contact: organizer?.phone || PORTAL_CONTACT.phone,
        email: organizer?.email || PORTAL_CONTACT.email,
        createdBy: admin._id,
      },
      data.title,
    );
  }

  console.log("Emergency services:");
  for (const { lat, lng, ...data } of emergencyServices) {
    // lat/lng bhae naksa ko lagi GeoJSON (MongoDB ma [lng, lat] kram)
    const service = lat !== undefined ? { ...data, location: { type: "Point", coordinates: [lng, lat] } } : data;
    await ensure(EmergencyService, { name: data.name }, service, `${data.name} (${data.phone})`);
  }

  console.log(
    DRY
      ? "\nDry run: sabai data thik chha, database ma kehi lekhiena."
      : `\nSeed sakiyo: ${count.created} naya, ${count.skipped} pahile nai thiye.\nDepartment login password: ${DEPARTMENT_PASSWORD}`,
  );
};

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exit(1);
  });
