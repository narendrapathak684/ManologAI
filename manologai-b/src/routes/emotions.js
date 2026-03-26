const express = require("express");

const auth = require("../middleware/auth");
const DailyEntry = require("../models/dailyEntry");

const router = express.Router();

const VALID_EMOTIONS = ["happy", "calm", "neutral", "sad", "stressed", "angry", "tired", "excited"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toLocalMidnight(dateInput) {
  if (!dateInput) return null;
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [y, m, d] = dateInput.split("-").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  const dt = new Date(dateInput);
  if (Number.isNaN(dt.getTime())) return null;
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function todayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isLocked(entry) {
  return entry.lockedUntil && new Date() > new Date(entry.lockedUntil);
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /emotions
// Set today's emotion. Creates the daily entry if it doesn't exist.
// Locked after 24h from creation.
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { emotion } = req.body || {};

    if (!emotion || !VALID_EMOTIONS.includes(emotion.toLowerCase())) {
      return res.status(400).json({
        error: `emotion must be one of: ${VALID_EMOTIONS.join(", ")}`,
      });
    }

    const today = todayMidnight();

    // Check if already locked
    const existing = await DailyEntry.findOne({ user: userId, date: today }).select("lockedUntil");
    if (existing && isLocked(existing)) {
      return res.status(403).json({ error: "Today's emotion entry is locked and can no longer be changed" });
    }

    const entry = await DailyEntry.findOneAndUpdate(
      { user: userId, date: today },
      { $set: { mood: emotion.toLowerCase() } },
      { new: true, upsert: true, select: "date mood lockedUntil" }
    );

    return res.status(200).json({ date: entry.date, emotion: entry.mood, locked: isLocked(entry) });
  } catch (err) {
    console.error("POST /emotions error:", err);
    return res.status(500).json({ error: "Failed to save emotion" });
  }
});

// PATCH /emotions/:date
// Change emotion for a specific date — blocked if locked.
router.patch("/:date", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { emotion } = req.body || {};

    if (!emotion || !VALID_EMOTIONS.includes(emotion.toLowerCase())) {
      return res.status(400).json({
        error: `emotion must be one of: ${VALID_EMOTIONS.join(", ")}`,
      });
    }

    const date = toLocalMidnight(req.params.date);
    if (!date) return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });

    const entry = await DailyEntry.findOne({ user: userId, date }).select("mood lockedUntil");
    if (!entry) return res.status(404).json({ error: "No entry found for this date" });

    if (isLocked(entry)) {
      return res.status(403).json({ error: "Emotion entry is locked and can no longer be changed" });
    }

    entry.mood = emotion.toLowerCase();
    await entry.save();

    return res.status(200).json({ date, emotion: entry.mood, locked: isLocked(entry) });
  } catch (err) {
    console.error("PATCH /emotions/:date error:", err);
    return res.status(500).json({ error: "Failed to update emotion" });
  }
});

// GET /emotions/today
// Get today's emotion.
router.get("/today", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const today = todayMidnight();

    const entry = await DailyEntry.findOne({ user: userId, date: today }).select("date mood lockedUntil");
    if (!entry) return res.status(404).json({ error: "No emotion logged for today yet" });

    return res.status(200).json({ date: entry.date, emotion: entry.mood, locked: isLocked(entry) });
  } catch (err) {
    console.error("GET /emotions/today error:", err);
    return res.status(500).json({ error: "Failed to fetch today's emotion" });
  }
});

// GET /emotions/month
// Get last 30 days of emotions — for calendar/chart view.
router.get("/month", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const to = new Date();
    to.setHours(23, 59, 59, 999);

    const from = new Date();
    from.setDate(from.getDate() - 29); // 30 days including today
    from.setHours(0, 0, 0, 0);

    const entries = await DailyEntry.find({
      user: userId,
      date: { $gte: from, $lte: to },
    })
      .select("date mood")
      .sort({ date: 1 });

    const result = entries.map((e) => ({ date: e.date, emotion: e.mood }));

    return res.status(200).json({ emotions: result, range: { from, to } });
  } catch (err) {
    console.error("GET /emotions/month error:", err);
    return res.status(500).json({ error: "Failed to fetch monthly emotions" });
  }
});

// GET /emotions/:date
// Get emotion for a specific date (YYYY-MM-DD).
// NOTE: this route is defined LAST to avoid catching /today and /month
router.get("/:date", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const date = toLocalMidnight(req.params.date);
    if (!date) return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });

    const entry = await DailyEntry.findOne({ user: userId, date }).select("date mood lockedUntil");
    if (!entry) return res.status(404).json({ error: "No entry found for this date" });

    return res.status(200).json({ date: entry.date, emotion: entry.mood, locked: isLocked(entry) });
  } catch (err) {
    console.error("GET /emotions/:date error:", err);
    return res.status(500).json({ error: "Failed to fetch emotion" });
  }
});

module.exports = router;
