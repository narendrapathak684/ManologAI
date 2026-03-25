const jwt = require("jsonwebtoken");
const User = require("../models/user");

// In production, always set JWT_SECRET in environment variables.
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const auth = async (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: "Please login first" });
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find user by id from token payload
    // Support common payload shapes: { userId }, { id }, { sub }, etc.
    const userId = decoded?.userId || decoded?.id || decoded?.sub || decoded?._id;

    if (!userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error && error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Session expired. Please login again" });
    }

    // Covers invalid signature / malformed token
    if (error && (error.name === "JsonWebTokenError" || error.name === "NotBeforeError")) {
      return res.status(401).json({ error: "Invalid token" });
    }

    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

module.exports = auth;
