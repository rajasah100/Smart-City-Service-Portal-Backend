const jwt = require("jsonwebtoken");
const Department = require("../models/Department");

const departmentProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.department = await Department.findById(decoded.department.id).select(
        "-password",
      );

      if (!req.department) {
        return res.status(401).json({
          message: "Department not found",
        });
      }

      return next();
    } catch (error) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }
  }

  return res.status(401).json({
    message: "No token provided",
  });
};

module.exports = { departmentProtect };
