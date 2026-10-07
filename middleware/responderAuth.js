const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Department = require("../models/Department");

// Department token wa Admin token dubai chalne middleware (SOS dashboard ko lagi)
const responderProtect = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer")) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);

    if (decoded.department?.id) {
      const department = await Department.findById(decoded.department.id).select(
        "-password",
      );

      if (department) {
        req.department = department;
        req.responder = { name: department.name, department: department._id };
        return next();
      }
    }

    if (decoded.user?.id) {
      const user = await User.findById(decoded.user.id).select("-password");

      if (user?.role === "admin") {
        req.user = user;
        req.responder = { name: `Admin (${user.name})`, department: null };
        return next();
      }
    }

    return res.status(403).json({ message: "Permission denied" });
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { responderProtect };
