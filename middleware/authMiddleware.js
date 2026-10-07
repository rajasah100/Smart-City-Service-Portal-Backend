const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.user.id).select("-password"); // Exclude password
      next();
    } catch (error) {
      console.error("Token verification failed:", error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token provided" });
  }
};


// // Middleware to check if the user is an admin 
// const admin = (req, res, next) => {
//   if (req.user && req.user.role === 'admin') {
//     next ();
//   } else {
//     res.status(403).json({ message: "Not authorized as an admin" });
//   }
// }

// Login bhae req.user rakhne, nabhae pani agadi badhne (guest le pani chalauna milne route)
const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization;

  if (header?.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
      req.user = await User.findById(decoded.user.id).select("-password");
    } catch {
      // Token bigreko/sakieko: guest jastai
      req.user = null;
    }
  }

  next();
};

module.exports = { protect, optionalAuth };
