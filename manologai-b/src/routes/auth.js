const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const { getCurrencyForCountry } = require("../config/currency");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // Must match `src/middleware/auth.js`

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};

router.post("/signup", async (req, res) => {
  try {
    const { email, password, firstName, lastName, country } = req.body || {};
    const normalizedFirstName =
      typeof firstName === "string" ? firstName.trim() : "";
    const normalizedLastName =
      typeof lastName === "string" ? lastName.trim() : "";
    const maxNameLength = 30;

    if (normalizedFirstName.length > maxNameLength) {
      return res.status(400).json({
        error: `First name must be ${maxNameLength} characters or fewer`,
      });
    }

    if (normalizedLastName.length > maxNameLength) {
      return res.status(400).json({
        error: `Last name must be ${maxNameLength} characters or fewer`,
      });
    }

    if (!country || typeof country !== "string" || !country.trim()) {
      return res.status(400).json({ error: "Country is required" });
    }

    const normalizedCountry = country.trim();
    if (normalizedCountry.length > 80) {
      return res
        .status(400)
        .json({ error: "Country must be 80 characters or fewer" });
    }

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // gensalt -> unique salt per password hash
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      country: normalizedCountry,
      currency: getCurrencyForCountry(normalizedCountry),
    });

    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, cookieOptions);

    return res.status(201).json({
      message: "Signup successful",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        country: user.country,
        currency: user.currency,
      },
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ error: "Email already registered" });
    }
    console.error("Signup route error:", error);
    return res.status(500).json({ error: "Signup failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, cookieOptions);

    const resolvedCurrency =
      user.currency || getCurrencyForCountry(user.country);

    if (!user.currency && resolvedCurrency) {
      user.currency = resolvedCurrency;
      await user.save();
    }

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        country: user.country,
        currency: user.currency,
      },
    });
  } catch (error) {
    console.error("Login route error:", error);
    return res.status(500).json({ error: "Login failed" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", { path: "/" });
  return res.status(200).json({ message: "Logout successful" });
});

module.exports = router;
