const express = require("express");
const bcrypt = require("bcrypt");

const auth = require("../middleware/auth");
const User = require("../models/user");

const router = express.Router();

// Reset password for the currently logged-in user (cookie/JWT protected).
// Body: { currentPassword, newPassword }
router.post("/reset-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "currentPassword and newPassword are required" });
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "newPassword must be at least 6 characters long" });
    }

    // `auth` middleware populates `req.user`
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "Please login first" });
    }

    const user = await User.findById(userId).select("+passwordHash");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ error: "Password reset failed" });
  }
});

module.exports = router;

