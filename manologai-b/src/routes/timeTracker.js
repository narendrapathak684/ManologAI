const express = require("express");

const auth = require("../middleware/auth");
const TimeTracker = require("../models/timeTracker");

const router = express.Router();

const LOCK_HOURS = 24; // entry becomes read-only after this many hours

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

function sanitizeFields(body) {
  const fields = {};
  const allowed = ["sleep", "screen", "workStudy", "expense"];

  for (const key of allowed) {
    if (body[key] !== undefined) {
      const val = Number(body[key]);
      if (Number.isNaN(val) || val < 0) {
        return { error: `${key} must be a non-negative number` };
      }
      fields[key] = val;
    }
  }
  return { fields };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /time-tracker
// Create or update today's entry. Locked after 24h from first creation.
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { error, fields } = sanitizeFields(req.body || {});
    if (error) return res.status(400).json({ error });

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: "At least one field is required: sleep, screen, workStudy, expense" });
    }

    // Check if existing entry is already locked
    const existing = await TimeTracker.findOne({ user: userId, date: today });
    if (existing && isLocked(existing)) {
      return res.status(403).json({ error: "Today's entry is locked and can no longer be edited" });
    }

    const entry = await TimeTracker.findOneAndUpdate(
      { user: userId, date: today },
      { $set: fields },
      { new: true, upsert: true }
    );

    return res.status(200).json({ entry });
  } catch (err) {
    console.error("POST /time-tracker error:", err);
    return res.status(500).json({ error: "Failed to save time tracker entry" });
  }
});

// GET /time-tracker/today
// Get today's time tracker entry.
router.get("/today", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const entry = await TimeTracker.findOne({ user: userId, date: today });
    if (!entry) return res.status(404).json({ error: "No entry for today yet" });

    return res.status(200).json({ entry, locked: isLocked(entry) });
  } catch (err) {
    console.error("GET /time-tracker/today error:", err);
    return res.status(500).json({ error: "Failed to fetch today's entry" });
  }
});

// GET /time-tracker
// Get entries in a date range for graphs/analytics.
// Query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=N
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { from, to, limit } = req.query;

    const filter = { user: userId };

    if (from || to) {
      filter.date = {};
      if (from) {
        const fromDate = toLocalMidnight(from);
        if (!fromDate) return res.status(400).json({ error: "Invalid 'from' date" });
        filter.date.$gte = fromDate;
      }
      if (to) {
        const toDate = toLocalMidnight(to);
        if (!toDate) return res.status(400).json({ error: "Invalid 'to' date" });
        toDate.setHours(23, 59, 59, 999);
        filter.date.$lte = toDate;
      }
    }

    const safeLimit = limit !== undefined
      ? Math.max(1, Math.min(Number(limit) || 30, 365))
      : 30;

    const entries = await TimeTracker.find(filter)
      .sort({ date: 1 })
      .limit(safeLimit);

    return res.status(200).json({ entries });
  } catch (err) {
    console.error("GET /time-tracker error:", err);
    return res.status(500).json({ error: "Failed to fetch entries" });
  }
});

// GET /time-tracker/:date
// Get the entry for a specific date (YYYY-MM-DD).
router.get("/:date", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const date = toLocalMidnight(req.params.date);
    if (!date) return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });

    const entry = await TimeTracker.findOne({ user: userId, date });
    if (!entry) return res.status(404).json({ error: "No entry found for this date" });

    return res.status(200).json({ entry, locked: isLocked(entry) });
  } catch (err) {
    console.error("GET /time-tracker/:date error:", err);
    return res.status(500).json({ error: "Failed to fetch entry" });
  }
});

// PATCH /time-tracker/:date
// Edit a specific date's entry — only allowed within 24 hours of creation.
router.patch("/:date", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const date = toLocalMidnight(req.params.date);
    if (!date) return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });

    const entry = await TimeTracker.findOne({ user: userId, date });
    if (!entry) return res.status(404).json({ error: "No entry found for this date" });

    if (isLocked(entry)) {
      return res.status(403).json({ error: "Entry is locked and can no longer be edited" });
    }

    const { error, fields } = sanitizeFields(req.body || {});
    if (error) return res.status(400).json({ error });

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: "At least one field is required: sleep, screen, workStudy, expense" });
    }

    const updated = await TimeTracker.findOneAndUpdate(
      { _id: entry._id },
      { $set: fields },
      { new: true }
    );

    return res.status(200).json({ entry: updated });
  } catch (err) {
    console.error("PATCH /time-tracker/:date error:", err);
    return res.status(500).json({ error: "Failed to update entry" });
  }
});

module.exports = router;
