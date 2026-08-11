const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Notice = require("./models/Notice");
const User = require("./models/User");
const Department = require("./models/Department");

const notices = require("./data/notices");

dotenv.config();

mongoose.connect(process.env.MONGODB_URL);

const seedData = async () => {
  try {
    await Notice.deleteMany();
    await User.deleteMany();
    await Department.deleteMany();

    //
    // Create Admin First
    //

    const createdUser = await User.create({
      name: "Admin User",

      email: "admin@example.com",

      password: "123456",

      role: "admin",
    });

    //
    // Create Departments
    //

    const electricity = await Department.create({
      name: "Electricity Department",

      email: "electricity@city.com",

      password: "electricity@123",

      phone: "9804702922",

      address: "Saptari",

      admin: createdUser._id,
    });

    const water = await Department.create({
      name: "Water Department",

      email: "water@city.com",

      password: "water@123",

      phone: "9812060473",

      address: "Janakpur",

      admin: createdUser._id,
    });

    //
    // Notice Mapping
    //

    const sampleNotices = notices.map((notice) => {
      let departmentId;

      if (notice.department === "electricity") {
        departmentId = electricity._id;
      } else if (notice.department === "water") {
        departmentId = water._id;
      }

      return {
        ...notice,

        department: departmentId,

        createdBy: createdUser._id,
      };
    });

    await Notice.insertMany(sampleNotices);

    console.log("Seed completed");

    process.exit();
  } catch (error) {
    console.log(error);

    process.exit(1);
  }
};

seedData();
