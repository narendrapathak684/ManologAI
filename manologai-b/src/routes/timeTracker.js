const express = require("express");

const auth = require("../middleware/auth");
const TimeTracker = require("../models/timeTracker");

const router = express.Router();

const LOCK_HOURS = 24;
const MAX_RANGE_LIMIT = 1000;



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

function isFutureDate(date) {
  return date.getTime() > todayMidnight().getTime();
}

function isLocked(entry) {
  if (entry.locked) return true;
  const hoursSinceCreation =
  (Date.now() - new Date(entry.createdAt).getTime()) / 36e5;
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

function validateDailyHours(fields, existingEntry) {
  const baseSleep = existingEntry?.sleep ?? 0;
  const baseScreen = existingEntry?.screen ?? 0;
  const baseWorkStudy = existingEntry?.workStudy ?? 0;

  const nextSleep = fields.sleep ?? baseSleep;
  const nextScreen = fields.screen ?? baseScreen;
  const nextWorkStudy = fields.workStudy ?? baseWorkStudy;

  const total = nextSleep + nextScreen + nextWorkStudy;
  if (total > 24) {
    return {
      error: "Sleep + Screen + Work/Study cannot exceed 24 hours"
    };
  }

  return {};
}





router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const today = todayMidnight();

    const { error, fields } = sanitizeFields(req.body || {});
    if (error) return res.status(400).json({ error });

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({
        error:
        "At least one field is required: sleep, screen, workStudy, expense"
      });
    }


    const existing = await TimeTracker.findOne({ user: userId, date: today });
    if (existing && isLocked(existing)) {
      return res.
      status(403).
      json({ error: "Today's entry is locked and can no longer be edited" });
    }

    const { error: limitError } = validateDailyHours(fields, existing);
    if (limitError) return res.status(400).json({ error: limitError });

    const entry = await TimeTracker.findOneAndUpdate(
      { user: userId, date: today },
      { $set: fields },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      entry,
      alreadySubmitted: Boolean(existing),
      locked: isLocked(entry)
    });
  } catch (err) {
    console.error("POST /time-tracker error:", err);
    return res.status(500).json({ error: "Failed to save time tracker entry" });
  }
});



router.post("/:date", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const date = toLocalMidnight(req.params.date);
    if (!date)
    return res.
    status(400).
    json({ error: "Invalid date format. Use YYYY-MM-DD" });
    if (isFutureDate(date)) {
      return res.
      status(400).
      json({ error: "Future time tracker entries are not allowed" });
    }

    const { error, fields } = sanitizeFields(req.body || {});
    if (error) return res.status(400).json({ error });

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({
        error:
        "At least one field is required: sleep, screen, workStudy, expense"
      });
    }

    const existing = await TimeTracker.findOne({ user: userId, date });
    if (existing && isLocked(existing)) {
      return res.
      status(403).
      json({ error: "Entry is locked and can no longer be edited" });
    }

    const { error: limitError } = validateDailyHours(fields, existing);
    if (limitError) return res.status(400).json({ error: limitError });

    const entry = await TimeTracker.findOneAndUpdate(
      { user: userId, date },
      { $set: fields },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      entry,
      locked: isLocked(entry),
      alreadySubmitted: Boolean(existing)
    });
  } catch (err) {
    console.error("POST /time-tracker/:date error:", err);
    return res.status(500).json({ error: "Failed to save time tracker entry" });
  }
});



router.get("/today", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const today = todayMidnight();

    const entry = await TimeTracker.findOne({ user: userId, date: today });
    if (!entry) {
      return res.status(200).json({
        entry: null,
        locked: false,
        alreadySubmitted: false
      });
    }

    return res.status(200).json({
      entry,
      locked: isLocked(entry),
      alreadySubmitted: true
    });
  } catch (err) {
    console.error("GET /time-tracker/today error:", err);
    return res.status(500).json({ error: "Failed to fetch today's entry" });
  }
});




router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { from, to, limit } = req.query;

    const filter = { user: userId };

    if (from || to) {
      filter.date = {};
      if (from) {
        const fromDate = toLocalMidnight(from);
        if (!fromDate)
        return res.status(400).json({ error: "Invalid 'from' date" });
        filter.date.$gte = fromDate;
      }
      if (to) {
        const toDate = toLocalMidnight(to);
        if (!toDate)
        return res.status(400).json({ error: "Invalid 'to' date" });
        toDate.setHours(23, 59, 59, 999);
        filter.date.$lte = toDate;
      }
    }

    const safeLimit =
    limit !== undefined ?
    Math.max(1, Math.min(Number(limit) || 30, MAX_RANGE_LIMIT)) :
    30;

    const entries = await TimeTracker.find(filter).
    sort({ date: 1 }).
    limit(safeLimit);

    return res.status(200).json({ entries });
  } catch (err) {
    console.error("GET /time-tracker error:", err);
    return res.status(500).json({ error: "Failed to fetch entries" });
  }
});




router.get("/averages", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { from, to } = req.query;

    const match = { user: userId };

    if (from || to) {
      match.date = {};
      if (from) {
        const fromDate = toLocalMidnight(from);
        if (!fromDate)
        return res.status(400).json({ error: "Invalid 'from' date" });
        match.date.$gte = fromDate;
      }
      if (to) {
        const toDate = toLocalMidnight(to);
        if (!toDate)
        return res.status(400).json({ error: "Invalid 'to' date" });
        toDate.setHours(23, 59, 59, 999);
        match.date.$lte = toDate;
      }
    }

    const [result] = await TimeTracker.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        avgSleep: { $avg: "$sleep" },
        avgScreen: { $avg: "$screen" },
        avgWorkStudy: { $avg: "$workStudy" },
        avgExpense: { $avg: "$expense" }
      }
    },
    {
      $project: {
        _id: 0,
        count: 1,
        avgSleep: { $ifNull: ["$avgSleep", 0] },
        avgScreen: { $ifNull: ["$avgScreen", 0] },
        avgWorkStudy: { $ifNull: ["$avgWorkStudy", 0] },
        avgExpense: { $ifNull: ["$avgExpense", 0] }
      }
    }]
    );

    const payload = result || {
      count: 0,
      avgSleep: 0,
      avgScreen: 0,
      avgWorkStudy: 0,
      avgExpense: 0
    };

    return res.status(200).json(payload);
  } catch (err) {
    console.error("GET /time-tracker/averages error:", err);
    return res.status(500).json({ error: "Failed to fetch averages" });
  }
});



router.get("/:date", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const date = toLocalMidnight(req.params.date);
    if (!date)
    return res.
    status(400).
    json({ error: "Invalid date format. Use YYYY-MM-DD" });
    if (isFutureDate(date)) {
      return res.
      status(400).
      json({ error: "Future time tracker entries are not allowed" });
    }

    const entry = await TimeTracker.findOne({ user: userId, date });
    if (!entry) {
      return res.status(200).json({
        entry: null,
        locked: false,
        alreadySubmitted: false
      });
    }

    return res.status(200).json({
      entry,
      locked: isLocked(entry),
      alreadySubmitted: true
    });
  } catch (err) {
    console.error("GET /time-tracker/:date error:", err);
    return res.status(500).json({ error: "Failed to fetch entry" });
  }
});



router.patch("/:date", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const date = toLocalMidnight(req.params.date);
    if (!date)
    return res.
    status(400).
    json({ error: "Invalid date format. Use YYYY-MM-DD" });

    const entry = await TimeTracker.findOne({ user: userId, date });
    if (!entry)
    return res.status(404).json({ error: "No entry found for this date" });

    if (isLocked(entry)) {
      return res.
      status(403).
      json({ error: "Entry is locked and can no longer be edited" });
    }

    const { error, fields } = sanitizeFields(req.body || {});
    if (error) return res.status(400).json({ error });

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({
        error:
        "At least one field is required: sleep, screen, workStudy, expense"
      });
    }

    const { error: limitError } = validateDailyHours(fields, entry);
    if (limitError) return res.status(400).json({ error: limitError });

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