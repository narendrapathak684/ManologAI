const express = require("express");

const auth = require("../middleware/auth");
const Habit = require("../models/habit");

const router = express.Router();

const VALID_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const VALID_FREQUENCIES = ["daily", "weekly", "custom"];
const MAX_HABIT_NAME_LENGTH = 60;

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

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isScheduledOnDay(habit, date) {
  if (habit.frequency === "daily") return true;

  const weekday = date
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  if (habit.frequency === "custom") {
    return (
      Array.isArray(habit.customDays) && habit.customDays.includes(weekday)
    );
  }

  if (habit.frequency === "weekly") {
    const createdAt = habit.createdAt ? new Date(habit.createdAt) : null;
    if (!createdAt || Number.isNaN(createdAt.getTime())) return false;
    const createdWeekday = createdAt
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    return weekday === createdWeekday;
  }

  return false;
}

// Recalculate currentStreak and longestStreak from history array.
// Streaks count consecutive days where completed === true, ending at today.
function recalculateStreaks(history) {
  // Sort completed entries ascending by date
  const completed = history
    .filter((h) => h.completed)
    .map((h) => new Date(h.date))
    .sort((a, b) => a - b);

  if (completed.length === 0) return { currentStreak: 0, longestStreak: 0 };

  let longestStreak = 1;
  let streak = 1;

  for (let i = 1; i < completed.length; i++) {
    const diff = (completed[i] - completed[i - 1]) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak++;
      longestStreak = Math.max(longestStreak, streak);
    } else if (diff > 1) {
      streak = 1;
    }
  }

  // currentStreak: streak must reach today or yesterday
  const today = todayMidnight();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const last = completed[completed.length - 1];
  const currentStreak =
    isSameDay(last, today) || isSameDay(last, yesterday) ? streak : 0;

  return { currentStreak, longestStreak };
}

// ─── Habit Management ─────────────────────────────────────────────────────────

// GET /habits/score
// Average completion score over the last N days (default 7).
router.get("/score", auth, async (req, res) => {
  try {
    const daysParam = Number(req.query.days) || 7;
    const days =
      Number.isFinite(daysParam) && daysParam > 0 ? Math.floor(daysParam) : 7;

    const habits = await Habit.find({ user: req.user._id }).sort({
      createdAt: 1,
    });
    if (habits.length === 0) {
      return res.status(200).json({ days, completed: 0, total: 0, percent: 0 });
    }

    const today = todayMidnight();
    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));

    let total = 0;
    let completed = 0;

    for (const habit of habits) {
      const completedSet = new Set(
        habit.history
          .filter((h) => h.completed)
          .map((h) => toDateKey(new Date(h.date))),
      );

      const cursor = new Date(start);
      while (cursor <= today) {
        if (isScheduledOnDay(habit, cursor)) {
          total += 1;
          if (completedSet.has(toDateKey(cursor))) {
            completed += 1;
          }
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return res.status(200).json({ days, completed, total, percent });
  } catch (err) {
    console.error("GET /habits/score error:", err);
    return res.status(500).json({ error: "Failed to calculate habit score" });
  }
});

// GET /habits
// Get all habits for the logged-in user.
router.get("/", auth, async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user._id }).sort({
      createdAt: 1,
    });
    return res.status(200).json({ habits });
  } catch (err) {
    console.error("GET /habits error:", err);
    return res.status(500).json({ error: "Failed to fetch habits" });
  }
});

// POST /habits
// Create a new habit.
router.post("/", auth, async (req, res) => {
  try {
    const { name, frequency, customDays } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Habit name is required" });
    }
    if (name.trim().length > MAX_HABIT_NAME_LENGTH) {
      return res.status(400).json({
        error: `Habit name must be ${MAX_HABIT_NAME_LENGTH} characters or fewer`,
      });
    }

    const freq = frequency || "daily";
    if (!VALID_FREQUENCIES.includes(freq)) {
      return res.status(400).json({
        error: `frequency must be one of: ${VALID_FREQUENCIES.join(", ")}`,
      });
    }

    let days = [];
    if (freq === "custom") {
      if (!Array.isArray(customDays) || customDays.length === 0) {
        return res
          .status(400)
          .json({ error: "customDays is required for custom frequency" });
      }
      days = customDays.map((d) => d.toLowerCase());
      const invalid = days.find((d) => !VALID_DAYS.includes(d));
      if (invalid) {
        return res.status(400).json({
          error: `Invalid day: "${invalid}". Must be one of: ${VALID_DAYS.join(", ")}`,
        });
      }
    }

    const habit = await Habit.create({
      user: req.user._id,
      name: name.trim(),
      frequency: freq,
      customDays: days,
      currentStreak: 0,
      longestStreak: 0,
      history: [],
    });

    return res.status(201).json({ habit });
  } catch (err) {
    console.error("POST /habits error:", err);
    return res.status(500).json({ error: "Failed to create habit" });
  }
});

// PATCH /habits/:habitId
// Edit a habit's name, frequency, or customDays.
router.patch("/:habitId", auth, async (req, res) => {
  try {
    const { name, frequency, customDays } = req.body || {};

    const habit = await Habit.findOne({
      _id: req.params.habitId,
      user: req.user._id,
    });
    if (!habit) return res.status(404).json({ error: "Habit not found" });

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Habit name cannot be empty" });
      }
      if (name.trim().length > MAX_HABIT_NAME_LENGTH) {
        return res.status(400).json({
          error: `Habit name must be ${MAX_HABIT_NAME_LENGTH} characters or fewer`,
        });
      }
      habit.name = name.trim();
    }

    if (frequency !== undefined) {
      if (!VALID_FREQUENCIES.includes(frequency)) {
        return res.status(400).json({
          error: `frequency must be one of: ${VALID_FREQUENCIES.join(", ")}`,
        });
      }
      habit.frequency = frequency;
    }

    if (customDays !== undefined) {
      if (!Array.isArray(customDays) || customDays.length === 0) {
        return res
          .status(400)
          .json({ error: "customDays must be a non-empty array" });
      }
      const days = customDays.map((d) => d.toLowerCase());
      const invalid = days.find((d) => !VALID_DAYS.includes(d));
      if (invalid) {
        return res.status(400).json({ error: `Invalid day: "${invalid}"` });
      }
      habit.customDays = days;
    }

    await habit.save();
    return res.status(200).json({ habit });
  } catch (err) {
    console.error("PATCH /habits/:habitId error:", err);
    return res.status(500).json({ error: "Failed to update habit" });
  }
});

// DELETE /habits/:habitId
// Delete a habit and its entire history.
router.delete("/:habitId", auth, async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.habitId,
      user: req.user._id,
    });
    if (!habit) return res.status(404).json({ error: "Habit not found" });

    await Habit.deleteOne({ _id: habit._id });
    return res.status(200).json({ message: "Habit deleted successfully" });
  } catch (err) {
    console.error("DELETE /habits/:habitId error:", err);
    return res.status(500).json({ error: "Failed to delete habit" });
  }
});

// ─── Completion Tracking ──────────────────────────────────────────────────────

// POST /habits/:habitId/check
// Mark habit as done for today. Recalculates streaks.
router.post("/:habitId/check", auth, async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.habitId,
      user: req.user._id,
    });
    if (!habit) return res.status(404).json({ error: "Habit not found" });

    const today = todayMidnight();

    // Prevent duplicate check-in for the same day
    const alreadyDone = habit.history.find(
      (h) => h.completed && isSameDay(new Date(h.date), today),
    );
    if (alreadyDone) {
      return res
        .status(409)
        .json({ error: "Habit already marked as done for today" });
    }

    habit.history.push({ date: today, completed: true });

    const { currentStreak, longestStreak } = recalculateStreaks(habit.history);
    habit.currentStreak = currentStreak;
    habit.longestStreak = longestStreak;

    await habit.save();
    return res.status(200).json({
      message: "Habit marked as done",
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
    });
  } catch (err) {
    console.error("POST /habits/:habitId/check error:", err);
    return res.status(500).json({ error: "Failed to mark habit" });
  }
});

// DELETE /habits/:habitId/check/:date
// Undo habit completion for a specific date. Recalculates streaks.
router.delete("/:habitId/check/:date", auth, async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.habitId,
      user: req.user._id,
    });
    if (!habit) return res.status(404).json({ error: "Habit not found" });

    const date = toLocalMidnight(req.params.date);
    if (!date)
      return res
        .status(400)
        .json({ error: "Invalid date format. Use YYYY-MM-DD" });

    const entryIndex = habit.history.findIndex(
      (h) => h.completed && isSameDay(new Date(h.date), date),
    );
    if (entryIndex === -1) {
      return res
        .status(404)
        .json({ error: "No completion found for this date" });
    }

    habit.history.splice(entryIndex, 1);

    const { currentStreak, longestStreak } = recalculateStreaks(habit.history);
    habit.currentStreak = currentStreak;
    habit.longestStreak = longestStreak;

    await habit.save();
    return res.status(200).json({
      message: "Completion removed",
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
    });
  } catch (err) {
    console.error("DELETE /habits/:habitId/check/:date error:", err);
    return res.status(500).json({ error: "Failed to undo habit completion" });
  }
});

// ─── History / Calendar ───────────────────────────────────────────────────────

// GET /habits/:habitId/history
// Get completion history for a habit.
// Optional query: ?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/:habitId/history", auth, async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.habitId,
      user: req.user._id,
    });
    if (!habit) return res.status(404).json({ error: "Habit not found" });

    let history = habit.history;

    const { from, to } = req.query;

    if (from) {
      const fromDate = toLocalMidnight(from);
      if (!fromDate)
        return res.status(400).json({ error: "Invalid 'from' date" });
      history = history.filter((h) => new Date(h.date) >= fromDate);
    }

    if (to) {
      const toDate = toLocalMidnight(to);
      if (!toDate) return res.status(400).json({ error: "Invalid 'to' date" });
      toDate.setHours(23, 59, 59, 999);
      history = history.filter((h) => new Date(h.date) <= toDate);
    }

    // Sort ascending for calendar rendering
    history = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));

    return res.status(200).json({
      habitId: habit._id,
      name: habit.name,
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
      completionRate:
        habit.history.length > 0
          ? Math.round(
              (habit.history.filter((h) => h.completed).length /
                habit.history.length) *
                100,
            )
          : 0,
      history,
    });
  } catch (err) {
    console.error("GET /habits/:habitId/history error:", err);
    return res.status(500).json({ error: "Failed to fetch habit history" });
  }
});

module.exports = router;
