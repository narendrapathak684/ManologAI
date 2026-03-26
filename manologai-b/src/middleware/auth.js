const jwt = require("jsonwebtoken");
const User = require("../models/user");

const JWT_SECRET = "your-secret-key"; // Must match `src/routes/auth.js`

async function auth(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated. Please login." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-passwordHash");
    if (!user) {
      return res.status(401).json({ error: "User not found. Please login again." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token. Please login again." });
  }
}

module.exports = auth;
