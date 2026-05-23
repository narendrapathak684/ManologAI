const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const { getCurrencyForCountry } = require("../config/currency");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "your-refresh-secret-key";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/"
};

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
};

router.post("/signup", async (req, res) => {
  try {
    const { email, password, name, country } = req.body || {};

    const normalizedEmail = String(email || "").toLowerCase().trim();
    const normalizedPassword = String(password || "");
    const normalizedCountry = String(country || "").trim();
    const fullName = String(name || "").trim();
    const firstName = String(req.body?.firstName || fullName.split(" ")[0] || "").trim();
    const lastName = String(
      req.body?.lastName || (fullName ? fullName.split(" ").slice(1).join(" ") : "")
    ).trim();

    if (!normalizedEmail || !normalizedPassword || !firstName) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }

    if (!(await User.findOne({ email: normalizedEmail }))) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(normalizedPassword, salt);
      const user = await User.create({
        email: normalizedEmail, passwordHash, firstName, lastName,
        country: normalizedCountry, currency: getCurrencyForCountry(normalizedCountry)
      });

      const { accessToken, refreshToken } = generateTokens(user._id.toString());
      user.sessions.push({
        token: refreshToken,
        userAgent: req.headers["user-agent"],
        ip: req.ip || req.connection.remoteAddress
      });
      await user.save();

      res.cookie("token", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
      res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.status(201).json({ message: "Signup successful", user });
    }
    return res.status(409).json({ error: "Email already registered" });
  } catch (error) {
    console.error("Signup failed:", error);
    if (error?.code === 11000) {
      return res.status(409).json({ error: "Email already registered" });
    }

    if (error?.name === "ValidationError") {
      return res.status(400).json({ error: "Invalid signup details" });
    }

    return res.status(500).json({ error: "Signup failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user || user.isDeleted || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const { accessToken, refreshToken } = generateTokens(user._id.toString());
    user.sessions.push({
      token: refreshToken,
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection.remoteAddress
    });
    if (user.sessions.length > 20) user.sessions.shift();
    await user.save();

    res.cookie("token", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: "Refresh token missing" });

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    const sessionIndex = user?.sessions.findIndex((s) => s.token === refreshToken);

    if (sessionIndex === -1) {
      if (user) {user.sessions = [];await user.save();}
      res.clearCookie("token");res.clearCookie("refreshToken");
      return res.status(403).json({ error: "Multiple session conflict - safety reset" });
    }

    const newTokens = generateTokens(user._id.toString());
    user.sessions[sessionIndex].token = newTokens.refreshToken;
    user.sessions[sessionIndex].lastActive = new Date();
    user.sessions[sessionIndex].ip = req.ip || req.connection.remoteAddress;
    await user.save();

    res.cookie("token", newTokens.accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", newTokens.refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(200).json({ message: "Token refreshed" });
  } catch (error) {
    res.clearCookie("token");res.clearCookie("refreshToken");
    return res.status(401).json({ error: "Invalid refresh token" });
  }
});

router.get("/sessions", require("../middleware/auth"), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const activeRefreshToken = req.cookies?.refreshToken;

    const sessions = user.sessions.map((s) => ({
      id: s._id,
      userAgent: s.userAgent,
      ip: s.ip,
      lastActive: s.lastActive,
      isCurrent: s.token === activeRefreshToken
    }));

    res.status(200).json({ sessions });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

router.delete("/sessions/others", require("../middleware/auth"), async (req, res) => {
  try {
    const activeRefreshToken = req.cookies?.refreshToken;
    const user = await User.findById(req.user._id);
    user.sessions = user.sessions.filter((s) => s.token === activeRefreshToken);
    await user.save();
    res.status(200).json({ message: "All other sessions revoked" });
  } catch (err) {
    res.status(500).json({ error: "Failed to revoke sessions" });
  }
});

router.delete("/sessions/:id", require("../middleware/auth"), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.sessions = user.sessions.filter((s) => s._id.toString() !== req.params.id);
    await user.save();
    res.status(200).json({ message: "Session revoked" });
  } catch (err) {
    res.status(500).json({ error: "Failed to revoke session" });
  }
});

router.post("/logout", async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    try {
      const decoded = jwt.decode(refreshToken);
      if (decoded?.userId) {
        await User.findByIdAndUpdate(decoded.userId, { $pull: { sessions: { token: refreshToken } } });
      }
    } catch (err) {}
  }
  res.clearCookie("token");res.clearCookie("refreshToken");
  res.status(200).json({ message: "Logout successful" });
});

module.exports = router;

module.exports = router;
