// Emergency services matra seed garne (aru data delete gardaina)
// Run: npm run seed:emergency
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const EmergencyService = require("./models/EmergencyService");

dotenv.config();

const services = [
  { name: "Nepal Police", type: "police", phone: "100", address: "Nationwide" },
  { name: "Fire Brigade", type: "fire", phone: "101", address: "Nationwide" },
  { name: "Ambulance Service", type: "ambulance", phone: "102", address: "Nationwide" },
  { name: "Traffic Police", type: "traffic", phone: "103", address: "Nationwide" },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);

    for (const service of services) {
      await EmergencyService.updateOne(
        { name: service.name },
        { $setOnInsert: service },
        { upsert: true },
      );
    }

    await EmergencyService.syncIndexes();

    console.log("Emergency services seeded");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seed();
