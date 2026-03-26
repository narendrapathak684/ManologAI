const express = require("express");

const auth = require("../middleware/auth");
const DailyEntry = require("../models/dailyEntry");

const router = express.Router();

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

// POST /diary - create/update today entry
router.post("/diary", auth, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "Please login first" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { text, rating, metrics } = req.body || {};
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
      { user: userId, date: today },
      { $set: update },
      { new: true, upsert: true, select: "-mood" }
    );

    return res.status(200).json({ entry });
  } catch (error) {
    console.error("Diary POST error:", error);
    return res.status(500).json({ error: "Failed to save diary entry" });
  }
});

// GET /diary/:date - get entry for a specific date
router.get("/diary/:date", auth, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "Please login first" });

    const date = parseDateOnlyToLocalMidnight(req.params.date);
    if (!date) return res.status(400).json({ error: "Invalid date format" });

    const entry = await DailyEntry.findOne({ user: userId, date }).select(
      "-mood"
    );
    if (!entry) return res.status(404).json({ error: "No entry found" });

    return res.status(200).json({ entry });
  } catch (error) {
    console.error("Diary GET by date error:", error);
    return res.status(500).json({ error: "Failed to fetch diary entry" });
  }
});

// GET /diary - recent entries
router.get("/diary", auth, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "Please login first" });

    const limitRaw = req.query.limit;
    const limit =
      limitRaw !== undefined ? Number(limitRaw) : 10;
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 50)) : 10;

    const entries = await DailyEntry.find({ user: userId })
      .select("-mood")
      .sort({ date: -1 })
      .limit(safeLimit);

    return res.status(200).json({ entries });
  } catch (error) {
    console.error("Diary GET recent error:", error);
    return res.status(500).json({ error: "Failed to fetch diary entries" });
  }
});

// POST /diary/edit/:date - edit diary entry only within 24 hours
router.post("/diary/edit/:date", auth, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "Please login first" });

    const date = parseDateOnlyToLocalMidnight(req.params.date);
    if (!date) return res.status(400).json({ error: "Invalid date format" });

    const entry = await DailyEntry.findOne({ user: userId, date });
    if (!entry) return res.status(404).json({ error: "No entry found" });

    // Allow edit only before lockedUntil (model default: + 24 hours from creation).
    if (entry.lockedUntil && new Date() > entry.lockedUntil) {
      return res.status(403).json({ error: "Diary entry is locked" });
    }

    const { text, rating, metrics } = req.body || {};

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

    // Keep lockedUntil as-is; only text/rating/metrics can change.
    const updated = await DailyEntry.findOneAndUpdate(
      { _id: entry._id },
      { $set: update },
      { new: true, select: "-mood" }
    );

    return res.status(200).json({ entry: updated });
  } catch (error) {
    console.error("Diary edit error:", error);
    return res.status(500).json({ error: "Failed to edit diary entry" });
  }
});

module.exports = router;

