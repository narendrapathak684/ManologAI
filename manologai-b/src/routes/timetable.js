const express = require("express");
const mongoose = require("mongoose");

const auth = require("../middleware/auth");
const Timetable = require("../models/timetable");

const router = express.Router();

const VALID_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function toMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function isValidTime(t) {
  if (typeof t !== "string") return false;
  if (!/^\d{2}:\d{2}$/.test(t)) return false;
  const [h, m] = t.split(":").map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

function findConflict(blocks, day, startTime, endTime, excludedIds = new Set()) {
  return blocks.find((block) => {
    if (excludedIds.has(block._id.toString())) return false;
    if (block.day !== day) return false;
    return overlaps(startTime, endTime, block.startTime, block.endTime);
  });
}

function normalizeDays(day, days) {
  const rawDays = Array.isArray(days) && days.length > 0 ? days : day ? [day] : [];
  const normalizedDays = rawDays.map((entry) => String(entry).toLowerCase());
  return [...new Set(normalizedDays)];
}

async function getOrCreateTimetable(userId) {
  let timetable = await Timetable.findOne({ user: userId });
  if (!timetable) {
    timetable = await Timetable.create({ user: userId, blocks: [] });
  }
  return timetable;
}

function groupByDay(blocks) {
  const grouped = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };

  for (const block of blocks) {
    grouped[block.day].push(block);
  }

  for (const day of Object.keys(grouped)) {
    grouped[day].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  }

  return grouped;
}

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

router.post("/blocks", auth, async (req, res) => {
  try {
    const { day, days, startTime, endTime, activity } = req.body || {};
    const normalizedDays = normalizeDays(day, days);

    if (normalizedDays.length === 0 || normalizedDays.some((entry) => !VALID_DAYS.includes(entry))) {
      return res.status(400).json({ error: `days must contain one or more of: ${VALID_DAYS.join(", ")}` });
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

    const timetable = await getOrCreateTimetable(req.user._id);

    for (const normalizedDay of normalizedDays) {
      const conflict = findConflict(timetable.blocks, normalizedDay, startTime, endTime);
      if (conflict) {
        return res.status(409).json({
          error: `Time block overlaps on ${normalizedDay} with existing block: "${conflict.activity}" (${conflict.startTime}-${conflict.endTime})`,
        });
      }
    }

    const groupId = normalizedDays.length > 1 ? new mongoose.Types.ObjectId().toString() : null;

    normalizedDays.forEach((normalizedDay) => {
      timetable.blocks.push({
        groupId,
        day: normalizedDay,
        startTime,
        endTime,
        activity: activity.trim(),
      });
    });

    await timetable.save();

    const addedBlocks = timetable.blocks.slice(-normalizedDays.length);
    return res.status(201).json({
      block: addedBlocks[0],
      blocks: addedBlocks,
    });
  } catch (err) {
    console.error("POST /timetable/blocks error:", err);
    return res.status(500).json({ error: "Failed to add time block" });
  }
});

router.patch("/blocks/:blockId", auth, async (req, res) => {
  try {
    const { blockId } = req.params;
    const { day, days, startTime, endTime, activity } = req.body || {};

    const timetable = await Timetable.findOne({ user: req.user._id });
    if (!timetable) return res.status(404).json({ error: "Timetable not found" });

    const block = timetable.blocks.id(blockId);
    if (!block) return res.status(404).json({ error: "Time block not found" });

    const blockGroup = block.groupId
      ? timetable.blocks.filter((entry) => entry.groupId === block.groupId)
      : [block];
    const excludedIds = new Set(blockGroup.map((entry) => entry._id.toString()));

    const incomingDays = normalizeDays(day, days);
    const nextDays = incomingDays.length > 0 ? incomingDays : blockGroup.map((entry) => entry.day);
    const newStart = startTime || block.startTime;
    const newEnd = endTime || block.endTime;
    const newActivity = activity ? activity.trim() : block.activity;

    if (nextDays.length === 0 || nextDays.some((entry) => !VALID_DAYS.includes(entry))) {
      return res.status(400).json({ error: `days must contain one or more of: ${VALID_DAYS.join(", ")}` });
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

    for (const nextDay of nextDays) {
      const conflict = findConflict(timetable.blocks, nextDay, newStart, newEnd, excludedIds);
      if (conflict) {
        return res.status(409).json({
          error: `Time block overlaps on ${nextDay} with existing block: "${conflict.activity}" (${conflict.startTime}-${conflict.endTime})`,
        });
      }
    }

    const nextGroupId =
      nextDays.length > 1 ? block.groupId || new mongoose.Types.ObjectId().toString() : null;
    const blocksByDay = new Map(blockGroup.map((entry) => [entry.day, entry]));
    const updatedBlocks = [];

    nextDays.forEach((nextDay) => {
      const existingBlock = blocksByDay.get(nextDay);
      if (existingBlock) {
        existingBlock.groupId = nextGroupId;
        existingBlock.day = nextDay;
        existingBlock.startTime = newStart;
        existingBlock.endTime = newEnd;
        existingBlock.activity = newActivity;
        existingBlock.updatedAt = new Date();
        updatedBlocks.push(existingBlock);
        return;
      }

      timetable.blocks.push({
        groupId: nextGroupId,
        day: nextDay,
        startTime: newStart,
        endTime: newEnd,
        activity: newActivity,
      });

      updatedBlocks.push(timetable.blocks[timetable.blocks.length - 1]);
    });

    blockGroup.forEach((entry) => {
      if (!nextDays.includes(entry.day)) {
        entry.deleteOne();
      }
    });

    await timetable.save();

    return res.status(200).json({
      block: updatedBlocks[0] || null,
      blocks: updatedBlocks,
    });
  } catch (err) {
    console.error("PATCH /timetable/blocks/:blockId error:", err);
    return res.status(500).json({ error: "Failed to update time block" });
  }
});

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
