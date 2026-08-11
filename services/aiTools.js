const Notice = require("../models/Notice");
const Department = require("../models/Department");

// ===============================
// Get Latest Notices
// ===============================
const getLatestNotices = async () => {
  try {
    const notices = await Notice.find({ status: "active" })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title description createdAt priority");

    return notices;
  } catch (error) {
    console.error("Notice Error:", error);
    return [];
  }
};

// ===============================
// Get All Departments
// ===============================
const getAllDepartments = async () => {
  try {
    const departments = await Department.find({ isActive: true })
      .select("name phone email address description")
      .sort({ name: 1 });

    return departments;
  } catch (error) {
    console.error("Department Error:", error);
    return [];
  }
};

module.exports = {
  getLatestNotices,
  getAllDepartments,
};
