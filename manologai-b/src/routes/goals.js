const express = require("express");
const auth = require("../middleware/auth");
const User = require("../models/user");

const router = express.Router();


router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ goals: user.goals || {} });
  } catch (error) {
    console.error("GET goals error:", error);
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});


router.patch("/", auth, async (req, res) => {
  try {
    const { goals } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { goals } },
      { new: true }
    );
    res.status(200).json({ message: "Goals updated successfully", goals: user.goals });
  } catch (error) {
    console.error("PATCH goals error:", error);
    res.status(500).json({ error: "Failed to update goals" });
  }
});

module.exports = router;