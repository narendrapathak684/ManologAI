const express = require("express");

const auth = require("../middleware/auth");
const DailyEntry = require("../models/dailyEntry");

const router = express.Router();
const MAX_RANGE_LIMIT = 1000;

function parseDateOnlyToLocalMidnight(dateInput) {
  // Accepts `YYYY-MM-DD` or a Date (or any parseable string).
  if (!dateInput) return null;

  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [y, m, d] = dateInput.split("-").map((v) => Number(v));
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }

  const dt = new Date(dateInput);
  if (Number.isNaN(dt.getTime())) return null;
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function getTodayLocalMidnight() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// POST /diary - create/update entry for a given date (defaults to today)
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "Please login first" });

    const { text, rating, metrics, date: rawDate } = req.body || {};
    const entryDate =
      parseDateOnlyToLocalMidnight(rawDate) || getTodayLocalMidnight();
    const today = getTodayLocalMidnight();

    if (entryDate.getTime() > today.getTime()) {
      return res
        .status(400)
        .json({ error: "Future diary entries are not allowed" });
    }

    if (rating !== undefined && rating !== null) {
      if (typeof rating !== "number" || rating < 0 || rating > 10) {
        return res
          .status(400)
          .json({ error: "rating must be a number between 0 and 10" });
      }
    }

    const update = {
      ...(text !== undefined ? { text } : {}),
      ...(rating !== undefined ? { rating } : {}),
      ...(metrics !== undefined ? { metrics } : {}),
    };

    // Upsert based on (user, date).
    const entry = await DailyEntry.findOneAndUpdate(
      { user: userId, date: entryDate },
      { $set: update },
      { new: true, upsert: true },
    );

    return res.status(200).json({ entry });
  } catch (error) {
    console.error("Diary POST error:", error);
    return res.status(500).json({ error: "Failed to save diary entry" });
  }
});

// GET /diary/range - entries within a date range
// Query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=N
router.get("/range", auth, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "Please login first" });

    const { from, to, limit } = req.query;
    if (!from || !to) {
      return res
        .status(400)
        .json({ error: "from and to query params are required" });
    }

    const fromDate = parseDateOnlyToLocalMidnight(from);
    const toDate = parseDateOnlyToLocalMidnight(to);
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

    const entries = await DailyEntry.find({
      user: userId,
      date: { $gte: fromDate, $lte: toDate },
    })
      .sort({ date: 1 })
      .limit(safeLimit);

    return res
      .status(200)
      .json({ entries, range: { from: fromDate, to: toDate } });
  } catch (error) {
    console.error("Diary GET range error:", error);
    return res.status(500).json({ error: "Failed to fetch diary entries" });
  }
});

// GET /diary/:date - get entry for a specific date
router.get("/:date", auth, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "Please login first" });

    const date = parseDateOnlyToLocalMidnight(req.params.date);
    if (!date) return res.status(400).json({ error: "Invalid date format" });

    const entry = await DailyEntry.findOne({ user: userId, date });
    if (!entry) return res.status(404).json({ error: "No entry found" });

    return res.status(200).json({ entry });
  } catch (error) {
    console.error("Diary GET by date error:", error);
    return res.status(500).json({ error: "Failed to fetch diary entry" });
  }
});

// GET /diary - recent entries
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "Please login first" });

    const limitRaw = req.query.limit;
    const limit = limitRaw !== undefined ? Number(limitRaw) : 10;
    const safeLimit = Number.isFinite(limit)
      ? Math.max(1, Math.min(limit, 50))
      : 10;

    const entries = await DailyEntry.find({ user: userId })
      .sort({ date: -1 })
      .limit(safeLimit);

    return res.status(200).json({ entries });
  } catch (error) {
    console.error("Diary GET recent error:", error);
    return res.status(500).json({ error: "Failed to fetch diary entries" });
  }
});

module.exports = router;
