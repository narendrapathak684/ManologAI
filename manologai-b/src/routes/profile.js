const express = require("express");
const bcrypt = require("bcrypt");
const multer = require("multer");

const auth = require("../middleware/auth");
const User = require("../models/user");
const cloudinary = require("../config/cloudinary");
const { getCurrencyForCountry } = require("../config/currency");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (file.mimetype?.startsWith("image/")) {
      return callback(null, true);
    }

    return callback(new Error("Profile picture must be an image file"));
  },
});

function uploadToCloudinary(fileBuffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "manologai/profile-pictures",
        resource_type: "image",
        transformation: [
          { width: 512, height: 512, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      },
    );

    stream.end(fileBuffer);
  });
}

// Get currently logged-in user profile info
router.get("/me", auth, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "Please login first" });
    }

    const user = await User.findById(userId).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Fetch profile error:", error);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Edit currently logged-in user profile info
router.patch("/me", auth, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "Please login first" });
    }

    const updates = req.body;
    const maxNameLength = 30;

    if (updates.firstName !== undefined) {
      if (typeof updates.firstName !== "string") {
        return res.status(400).json({ error: "First name must be a string" });
      }
      updates.firstName = updates.firstName.trim();
      if (updates.firstName.length > maxNameLength) {
        return res.status(400).json({
          error: `First name must be ${maxNameLength} characters or fewer`,
        });
      }
    }

    if (updates.lastName !== undefined) {
      if (typeof updates.lastName !== "string") {
        return res.status(400).json({ error: "Last name must be a string" });
      }
      updates.lastName = updates.lastName.trim();
      if (updates.lastName.length > maxNameLength) {
        return res.status(400).json({
          error: `Last name must be ${maxNameLength} characters or fewer`,
        });
      }
    }

    // Security: explicitly prevent updating email and password via this route
    delete updates.email;
    delete updates.passwordHash;
    delete updates.password;
    delete updates.currency;
    delete updates.profilePicture;

    if (updates.country) {
      updates.currency = getCurrencyForCountry(updates.country);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true },
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res
      .status(200)
      .json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

router.patch("/me/profile-picture", auth, (req, res) => {
  upload.single("profilePicture")(req, res, async (uploadError) => {
    try {
      if (uploadError) {
        return res.status(400).json({ error: uploadError.message });
      }

      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ error: "Please login first" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Profile picture is required" });
      }

      const user = await User.findById(userId).select("-passwordHash");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const previousPublicId = user.profilePicture?.publicId;
      const uploadResult = await uploadToCloudinary(req.file.buffer);

      user.profilePicture = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
      await user.save();

      if (previousPublicId) {
        cloudinary.uploader.destroy(previousPublicId).catch((error) => {
          console.warn("Failed to remove previous profile picture:", error);
        });
      }

      return res
        .status(200)
        .json({ message: "Profile picture updated successfully", user });
    } catch (error) {
      console.error("Update profile picture error:", error);
      return res
        .status(500)
        .json({ error: "Failed to update profile picture" });
    }
  });
});

router.delete("/me/profile-picture", auth, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "Please login first" });
    }

    const user = await User.findById(userId).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const previousPublicId = user.profilePicture?.publicId;
    user.profilePicture = { url: "", publicId: "" };
    await user.save();

    if (previousPublicId) {
      await cloudinary.uploader.destroy(previousPublicId);
    }

    return res
      .status(200)
      .json({ message: "Profile picture removed successfully", user });
  } catch (error) {
    console.error("Remove profile picture error:", error);
    return res.status(500).json({ error: "Failed to remove profile picture" });
  }
});

// Delete account — marks account as deleted (soft-delete) and clears session.
// Data is intentionally preserved in DB; isDeleted flag blocks future logins.
router.delete("/me", auth, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "Please login first" });
    }

    // Soft-delete: stamp the flag — no data is physically removed.
    await User.findByIdAndUpdate(userId, { $set: { isDeleted: true } });

    // Invalidate the session cookie so the client is logged out immediately.
    res.clearCookie("token", { path: "/" });
    return res
      .status(200)
      .json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    return res.status(500).json({ error: "Failed to delete account" });
  }
});

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
