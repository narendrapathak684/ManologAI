const express = require("express");

const auth = require("../middleware/auth");
const Emotion = require("../models/emotions");

const router = express.Router();
const MAX_RANGE_LIMIT = 1000;

const VALID_EMOTIONS = [
  "happy",
  "calm",
  "neutral",
  "sad",
  "stressed",
  "angry",
  "tired",
  "excited",
];

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
  return entry.lockedUntil && new Date() > new Date(entry.lockedUntil);
}

function getRangeWindow(range) {
  const to = new Date();
  to.setHours(23, 59, 59, 999);

  const from = new Date();
  const daysBack = range === "year" ? 364 : range === "week" ? 6 : 29;
  from.setDate(from.getDate() - daysBack);
  from.setHours(0, 0, 0, 0);

  return { from, to };
}

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
    const existing = await Emotion.findOne({
      user: userId,
      date: today,
    }).select("lockedUntil");
    if (existing && isLocked(existing)) {
      return res.status(403).json({
        error: "Today's emotion entry is locked and can no longer be changed",
      });
    }

    const entry = await Emotion.findOneAndUpdate(
      { user: userId, date: today },
      { $set: { emotion: emotion.toLowerCase() } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        select: "date emotion lockedUntil",
      },
    );

    return res.status(200).json({
      date: entry.date,
      emotion: entry.emotion,
      locked: isLocked(entry),
      alreadySubmitted: Boolean(existing),
    });
  } catch (err) {
    console.error("POST /emotions error:", err);
    return res.status(500).json({ error: "Failed to save emotion" });
  }
});

router.post("/:date", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { emotion } = req.body || {};

    if (!emotion || !VALID_EMOTIONS.includes(emotion.toLowerCase())) {
      return res.status(400).json({
        error: `emotion must be one of: ${VALID_EMOTIONS.join(", ")}`,
      });
    }

    const date = toLocalMidnight(req.params.date);
    if (!date)
      return res
        .status(400)
        .json({ error: "Invalid date format. Use YYYY-MM-DD" });
    if (isFutureDate(date)) {
      return res
        .status(400)
        .json({ error: "Future emotion entries are not allowed" });
    }

    const existing = await Emotion.findOne({ user: userId, date }).select(
      "lockedUntil",
    );
    if (existing && isLocked(existing)) {
      return res.status(403).json({
        error: "Emotion entry is locked and can no longer be changed",
      });
    }

    const entry = await Emotion.findOneAndUpdate(
      { user: userId, date },
      { $set: { emotion: emotion.toLowerCase() } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        select: "date emotion lockedUntil",
      },
    );

    return res.status(200).json({
      date: entry.date,
      emotion: entry.emotion,
      locked: isLocked(entry),
      alreadySubmitted: Boolean(existing),
    });
  } catch (err) {
    console.error("POST /emotions/:date error:", err);
    return res.status(500).json({ error: "Failed to save emotion" });
  }
});

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
    if (!date)
      return res
        .status(400)
        .json({ error: "Invalid date format. Use YYYY-MM-DD" });
    if (isFutureDate(date)) {
      return res
        .status(400)
        .json({ error: "Future emotion entries are not allowed" });
    }

    const entry = await Emotion.findOne({ user: userId, date }).select(
      "date emotion lockedUntil",
    );
    if (!entry)
      return res.status(404).json({ error: "No entry found for this date" });

    if (isLocked(entry)) {
      return res.status(403).json({
        error: "Emotion entry is locked and can no longer be changed",
      });
    }

    entry.emotion = emotion.toLowerCase();
    await entry.save();

    return res.status(200).json({
      date: entry.date,
      emotion: entry.emotion,
      locked: isLocked(entry),
    });
  } catch (err) {
    console.error("PATCH /emotions/:date error:", err);
    return res.status(500).json({ error: "Failed to update emotion" });
  }
});

router.get("/today", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const today = todayMidnight();

    const entry = await Emotion.findOne({ user: userId, date: today }).select(
      "date emotion lockedUntil",
    );
    if (!entry) {
      return res.status(200).json({
        date: today,
        emotion: null,
        locked: false,
        alreadySubmitted: false,
      });
    }

    return res.status(200).json({
      date: entry.date,
      emotion: entry.emotion,
      locked: isLocked(entry),
      alreadySubmitted: true,
    });
  } catch (err) {
    console.error("GET /emotions/today error:", err);
    return res.status(500).json({ error: "Failed to fetch today's emotion" });
  }
});

router.get("/month", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { from, to } = getRangeWindow("month");

    const entries = await Emotion.find({
      user: userId,
      date: { $gte: from, $lte: to },
    })
      .select("date emotion")
      .sort({ date: 1 });

    const result = entries.map((entry) => ({
      date: entry.date,
      emotion: entry.emotion,
    }));

    return res.status(200).json({ emotions: result, range: { from, to } });
  } catch (err) {
    console.error("GET /emotions/month error:", err);
    return res.status(500).json({ error: "Failed to fetch monthly emotions" });
  }
});

// GET /emotions/range
// Get entries within a date range.
// Query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=N
router.get("/range", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { from, to, limit } = req.query;
    if (!from || !to) {
      return res
        .status(400)
        .json({ error: "from and to query params are required" });
    }

    const fromDate = toLocalMidnight(from);
    const toDate = toLocalMidnight(to);
    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "Invalid date format" });
    }
    if (toDate < fromDate) {
      return res.status(400).json({ error: "to must be on or after from" });
    }

    toDate.setHours(23, 59, 59, 999);
    const safeLimit =
      limit !== undefined
        ? Math.max(1, Math.min(Number(limit) || 62, MAX_RANGE_LIMIT))
        : 62;

    const entries = await Emotion.find({
      user: userId,
      date: { $gte: fromDate, $lte: toDate },
    })
      .select("date emotion")
      .sort({ date: 1 })
      .limit(safeLimit);

    const result = entries.map((entry) => ({
      date: entry.date,
      emotion: entry.emotion,
    }));

    return res
      .status(200)
      .json({ emotions: result, range: { from: fromDate, to: toDate } });
  } catch (err) {
    console.error("GET /emotions/range error:", err);
    return res.status(500).json({ error: "Failed to fetch emotions" });
  }
});

router.get("/range/:range", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { range } = req.params;
    if (!range || !["week", "month", "year"].includes(range)) {
      return res
        .status(400)
        .json({ error: "Range must be week, month, or year" });
    }

    const { from, to } = getRangeWindow(range);

    const entries = await Emotion.find({
      user: userId,
      date: { $gte: from, $lte: to },
    })
      .select("date emotion")
      .sort({ date: 1 });

    const result = entries.map((entry) => ({
      date: entry.date,
      emotion: entry.emotion,
    }));

    return res.status(200).json({ emotions: result, range: { from, to } });
  } catch (err) {
    console.error("GET /emotions/range/:range error:", err);
    return res.status(500).json({ error: "Failed to fetch emotions" });
  }
});

router.get("/:date", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const date = toLocalMidnight(req.params.date);
    if (!date)
      return res
        .status(400)
        .json({ error: "Invalid date format. Use YYYY-MM-DD" });

    const entry = await Emotion.findOne({ user: userId, date }).select(
      "date emotion lockedUntil",
    );
    if (!entry) {
      return res.status(200).json({
        date: date,
        emotion: null,
        locked: false,
        alreadySubmitted: false,
      });
    }

    return res.status(200).json({
      date: entry.date,
      emotion: entry.emotion,
      locked: isLocked(entry),
      alreadySubmitted: true,
    });
  } catch (err) {
    console.error("GET /emotions/:date error:", err);
    return res.status(500).json({ error: "Failed to fetch emotion" });
  }
});

module.exports = router;
