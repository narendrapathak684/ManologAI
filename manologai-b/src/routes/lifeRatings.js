const express = require("express");

const auth = require("../middleware/auth");
const LifeRating = require("../models/lifeRating");

const router = express.Router();

const LOCK_HOURS = 24;

const RATING_FIELDS = [
  "partner",
  "familyFriends",
  "health",
  "finances",
  "career",
  "physicalEnvironment",
  "funRecreation",
  "personalGrowth",
];

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

function isLocked(entry) {
  if (entry.locked) return true;
  const hoursSinceCreation = (Date.now() - new Date(entry.createdAt).getTime()) / 36e5;
  return hoursSinceCreation > LOCK_HOURS;
}

// Validate and extract ratings from request body
function sanitizeRatings(body) {
  const ratings = {};
  for (const field of RATING_FIELDS) {
    if (body[field] !== undefined) {
      const val = Number(body[field]);
      if (Number.isNaN(val) || val < 0 || val > 10) {
        return { error: `${field} must be a number between 0 and 10` };
      }
      ratings[field] = val;
    }
  }
  return { ratings };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /life-ratings
// Submit or update today's life ratings. Locked after 24h from first submission.
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { error, ratings } = sanitizeRatings(req.body || {});
    if (error) return res.status(400).json({ error });

    if (Object.keys(ratings).length === 0) {
      return res.status(400).json({
        error: `At least one rating field is required: ${RATING_FIELDS.join(", ")}`,
      });
    }

    // Check if existing entry is already locked
    const existing = await LifeRating.findOne({ user: userId, date: today });
    if (existing && isLocked(existing)) {
      return res.status(403).json({ error: "Today's life rating is locked and can no longer be edited" });
    }

    // Build $set payload with nested ratings prefix
    const setPayload = {};
    for (const [key, val] of Object.entries(ratings)) {
      setPayload[`ratings.${key}`] = val;
    }

    const entry = await LifeRating.findOneAndUpdate(
      { user: userId, date: today },
      { $set: setPayload },
      { new: true, upsert: true }
    );

    return res.status(200).json({ entry, locked: isLocked(entry) });
  } catch (err) {
    console.error("POST /life-ratings error:", err);
    return res.status(500).json({ error: "Failed to save life rating" });
  }
});

// PATCH /life-ratings/:date
// Edit a specific date's ratings — blocked if locked (older than 24h).
router.patch("/:date", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const date = toLocalMidnight(req.params.date);
    if (!date) return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });

    const entry = await LifeRating.findOne({ user: userId, date });
    if (!entry) return res.status(404).json({ error: "No life rating found for this date" });

    if (isLocked(entry)) {
      return res.status(403).json({ error: "Life rating is locked and can no longer be edited" });
    }

    const { error, ratings } = sanitizeRatings(req.body || {});
    if (error) return res.status(400).json({ error });

    if (Object.keys(ratings).length === 0) {
      return res.status(400).json({
        error: `At least one rating field is required: ${RATING_FIELDS.join(", ")}`,
      });
    }

    const setPayload = {};
    for (const [key, val] of Object.entries(ratings)) {
      setPayload[`ratings.${key}`] = val;
    }

    const updated = await LifeRating.findOneAndUpdate(
      { _id: entry._id },
      { $set: setPayload },
      { new: true }
    );

    return res.status(200).json({ entry: updated, locked: isLocked(updated) });
  } catch (err) {
    console.error("PATCH /life-ratings/:date error:", err);
    return res.status(500).json({ error: "Failed to update life rating" });
  }
});

// GET /life-ratings/day
// Get today's ratings, or a specific day via ?date=YYYY-MM-DD
router.get("/day", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const target = req.query.date
      ? toLocalMidnight(req.query.date)
      : (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

    if (!target) return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });

    const entry = await LifeRating.findOne({ user: userId, date: target });
    if (!entry) return res.status(404).json({ error: "No life rating found for this date" });

    return res.status(200).json({ entry, locked: isLocked(entry) });
  } catch (err) {
    console.error("GET /life-ratings/day error:", err);
    return res.status(500).json({ error: "Failed to fetch life rating" });
  }
});

// GET /life-ratings/month
// Get the last 30 days of life ratings (for monthly graph/analysis).
router.get("/month", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const to = new Date();
    to.setHours(23, 59, 59, 999);

    const from = new Date();
    from.setDate(from.getDate() - 29); // 30 days including today
    from.setHours(0, 0, 0, 0);

    const entries = await LifeRating.find({
      user: userId,
      date: { $gte: from, $lte: to },
    }).sort({ date: 1 });

    return res.status(200).json({ entries, range: { from, to } });
  } catch (err) {
    console.error("GET /life-ratings/month error:", err);
    return res.status(500).json({ error: "Failed to fetch monthly life ratings" });
  }
});

// GET /life-ratings/90days
// Get the last 90 days of life ratings (for trend analysis / insight engine).
router.get("/90days", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const to = new Date();
    to.setHours(23, 59, 59, 999);

    const from = new Date();
    from.setDate(from.getDate() - 89); // 90 days including today
    from.setHours(0, 0, 0, 0);

    const entries = await LifeRating.find({
      user: userId,
      date: { $gte: from, $lte: to },
    }).sort({ date: 1 });

    return res.status(200).json({ entries, range: { from, to } });
  } catch (err) {
    console.error("GET /life-ratings/90days error:", err);
    return res.status(500).json({ error: "Failed to fetch 90-day life ratings" });
  }
});

module.exports = router;
