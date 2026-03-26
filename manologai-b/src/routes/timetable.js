const express = require("express");

const auth = require("../middleware/auth");
const Timetable = require("../models/timetable");

const router = express.Router();

const VALID_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Convert "HH:MM" to total minutes for easy comparison
function toMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// Validate time string is "HH:MM" in 24-hour format
function isValidTime(t) {
  if (typeof t !== "string") return false;
  if (!/^\d{2}:\d{2}$/.test(t)) return false;
  const [h, m] = t.split(":").map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

// Check if two time ranges overlap
function overlaps(aStart, aEnd, bStart, bEnd) {
  return toMinutes(aStart) < toMinutes(bEnd) &&
         toMinutes(bStart) < toMinutes(aEnd);
}

// Find conflicting block among existing blocks (excluding one by id if editing)
function findConflict(blocks, day, startTime, endTime, excludeId = null) {
  return blocks.find((b) => {
    if (excludeId && b._id.toString() === excludeId) return false;
    if (b.day !== day) return false;
    return overlaps(startTime, endTime, b.startTime, b.endTime);
  });
}

// Get or create a user's timetable document
async function getOrCreateTimetable(userId) {
  let timetable = await Timetable.findOne({ user: userId });
  if (!timetable) {
    timetable = await Timetable.create({ user: userId, blocks: [] });
  }
  return timetable;
}

// Group blocks by day for a cleaner API response
function groupByDay(blocks) {
  const grouped = {
    monday: [], tuesday: [], wednesday: [], thursday: [],
    friday: [], saturday: [], sunday: [],
  };
  for (const block of blocks) {
    grouped[block.day].push(block);
  }
  // Sort each day's blocks by start time
  for (const day of Object.keys(grouped)) {
    grouped[day].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  }
  return grouped;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /timetable
// Get the user's full weekly timetable, grouped by day.
router.get("/", auth, async (req, res) => {
  try {
    const timetable = await getOrCreateTimetable(req.user._id);
    return res.status(200).json({
      timetableId: timetable._id,
      schedule: groupByDay(timetable.blocks),
      updatedAt: timetable.updatedAt,
    });
  } catch (err) {
    console.error("GET /timetable error:", err);
    return res.status(500).json({ error: "Failed to fetch timetable" });
  }
});

// POST /timetable/blocks
// Add a new time block. Rejects if it overlaps with an existing block on the same day.
router.post("/blocks", auth, async (req, res) => {
  try {
    const { day, startTime, endTime, activity } = req.body || {};

    // Validate
    if (!day || !VALID_DAYS.includes(day.toLowerCase())) {
      return res.status(400).json({ error: `day must be one of: ${VALID_DAYS.join(", ")}` });
    }
    if (!isValidTime(startTime)) {
      return res.status(400).json({ error: "startTime must be in HH:MM (24-hour) format" });
    }
    if (!isValidTime(endTime)) {
      return res.status(400).json({ error: "endTime must be in HH:MM (24-hour) format" });
    }
    if (toMinutes(startTime) >= toMinutes(endTime)) {
      return res.status(400).json({ error: "endTime must be after startTime" });
    }
    if (!activity || typeof activity !== "string" || !activity.trim()) {
      return res.status(400).json({ error: "activity is required" });
    }

    const normalizedDay = day.toLowerCase();
    const timetable = await getOrCreateTimetable(req.user._id);

    // Overlap check
    const conflict = findConflict(timetable.blocks, normalizedDay, startTime, endTime);
    if (conflict) {
      return res.status(409).json({
        error: `Time block overlaps with existing block: "${conflict.activity}" (${conflict.startTime}–${conflict.endTime})`,
      });
    }

    timetable.blocks.push({
      day: normalizedDay,
      startTime,
      endTime,
      activity: activity.trim(),
    });

    await timetable.save();

    const added = timetable.blocks[timetable.blocks.length - 1];
    return res.status(201).json({ block: added });
  } catch (err) {
    console.error("POST /timetable/blocks error:", err);
    return res.status(500).json({ error: "Failed to add time block" });
  }
});

// PATCH /timetable/blocks/:blockId
// Edit an existing time block. Re-checks overlaps after edit.
router.patch("/blocks/:blockId", auth, async (req, res) => {
  try {
    const { blockId } = req.params;
    const { day, startTime, endTime, activity } = req.body || {};

    const timetable = await Timetable.findOne({ user: req.user._id });
    if (!timetable) return res.status(404).json({ error: "Timetable not found" });

    const block = timetable.blocks.id(blockId);
    if (!block) return res.status(404).json({ error: "Time block not found" });

    // Use updated or existing values for validation
    const newDay      = day      ? day.toLowerCase()  : block.day;
    const newStart    = startTime || block.startTime;
    const newEnd      = endTime   || block.endTime;
    const newActivity = activity  ? activity.trim()    : block.activity;

    if (!VALID_DAYS.includes(newDay)) {
      return res.status(400).json({ error: `day must be one of: ${VALID_DAYS.join(", ")}` });
    }
    if (!isValidTime(newStart)) {
      return res.status(400).json({ error: "startTime must be in HH:MM (24-hour) format" });
    }
    if (!isValidTime(newEnd)) {
      return res.status(400).json({ error: "endTime must be in HH:MM (24-hour) format" });
    }
    if (toMinutes(newStart) >= toMinutes(newEnd)) {
      return res.status(400).json({ error: "endTime must be after startTime" });
    }
    if (!newActivity) {
      return res.status(400).json({ error: "activity cannot be empty" });
    }

    // Overlap check (exclude the block being edited)
    const conflict = findConflict(timetable.blocks, newDay, newStart, newEnd, blockId);
    if (conflict) {
      return res.status(409).json({
        error: `Time block overlaps with existing block: "${conflict.activity}" (${conflict.startTime}–${conflict.endTime})`,
      });
    }

    block.day       = newDay;
    block.startTime = newStart;
    block.endTime   = newEnd;
    block.activity  = newActivity;
    block.updatedAt = new Date();

    await timetable.save();
    return res.status(200).json({ block });
  } catch (err) {
    console.error("PATCH /timetable/blocks/:blockId error:", err);
    return res.status(500).json({ error: "Failed to update time block" });
  }
});

// DELETE /timetable/blocks/:blockId
// Remove a time block from the timetable.
router.delete("/blocks/:blockId", auth, async (req, res) => {
  try {
    const { blockId } = req.params;

    const timetable = await Timetable.findOne({ user: req.user._id });
    if (!timetable) return res.status(404).json({ error: "Timetable not found" });

    const block = timetable.blocks.id(blockId);
    if (!block) return res.status(404).json({ error: "Time block not found" });

    block.deleteOne();
    await timetable.save();

    return res.status(200).json({ message: "Time block deleted successfully" });
  } catch (err) {
    console.error("DELETE /timetable/blocks/:blockId error:", err);
    return res.status(500).json({ error: "Failed to delete time block" });
  }
});

module.exports = router;
