const express = require("express");

const auth = require("../middleware/auth");
const Pad = require("../models/pad");

const router = express.Router();

const DEFAULT_PADS = [
  { padType: "goals", title: "Goals" },
  { padType: "books", title: "Books to Read" },
  { padType: "to-learn", title: "To Learn" },
  { padType: "to-do", title: "To Do" },
  { padType: "to-buy", title: "To Buy" },
  { padType: "ideas", title: "Ideas" },
];

// ─── Helper ──────────────────────────────────────────────────────────────────

// Seed default pads for a user if they don't exist yet.
async function seedDefaultPads(userId) {
  for (const def of DEFAULT_PADS) {
    const exists = await Pad.findOne({ user: userId, padType: def.padType });
    if (!exists) {
      await Pad.create({
        user: userId,
        padType: def.padType,
        title: def.title,
        items: [],
      });
    }
  }
}

// ─── Pad Routes ───────────────────────────────────────────────────────────────

// GET /pads - get all pads for logged-in user (seeds defaults on first access)
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    await seedDefaultPads(userId);

    const pads = await Pad.find({ user: userId }).sort({ createdAt: 1 });
    return res.status(200).json({ pads });
  } catch (err) {
    console.error("GET /pads error:", err);
    return res.status(500).json({ error: "Failed to fetch pads" });
  }
});

// POST /pads - create a new custom pad
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { title } = req.body || {};

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Pad title is required" });
    }

    const pad = await Pad.create({
      user: userId,
      padType: "custom",
      title: title.trim(),
      items: [],
    });

    return res.status(201).json({ pad });
  } catch (err) {
    console.error("POST /pads error:", err);
    return res.status(500).json({ error: "Failed to create pad" });
  }
});

// PATCH /pads/:padId - rename a pad
router.patch("/:padId", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { padId } = req.params;
    const { title } = req.body || {};

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Pad title is required" });
    }

    const pad = await Pad.findOne({ _id: padId, user: userId });
    if (!pad) return res.status(404).json({ error: "Pad not found" });

    pad.title = title.trim();
    pad.updatedAt = new Date();
    await pad.save();

    return res.status(200).json({ pad });
  } catch (err) {
    console.error("PATCH /pads/:padId error:", err);
    return res.status(500).json({ error: "Failed to rename pad" });
  }
});

// DELETE /pads/:padId - delete a pad and all its items
router.delete("/:padId", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { padId } = req.params;

    const pad = await Pad.findOne({ _id: padId, user: userId });
    if (!pad) return res.status(404).json({ error: "Pad not found" });

    await Pad.deleteOne({ _id: padId });

    return res.status(200).json({ message: "Pad deleted successfully" });
  } catch (err) {
    console.error("DELETE /pads/:padId error:", err);
    return res.status(500).json({ error: "Failed to delete pad" });
  }
});

// ─── Pad Item Routes ──────────────────────────────────────────────────────────

// GET /pads/:padId/items - get all items in a pad
router.get("/:padId/items", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { padId } = req.params;

    const pad = await Pad.findOne({ _id: padId, user: userId });
    if (!pad) return res.status(404).json({ error: "Pad not found" });

    return res.status(200).json({ items: pad.items });
  } catch (err) {
    console.error("GET /pads/:padId/items error:", err);
    return res.status(500).json({ error: "Failed to fetch items" });
  }
});

// POST /pads/:padId/items - add a new item to a pad
router.post("/:padId/items", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { padId } = req.params;
    const { title, note, startDate, endDate } = req.body || {};

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Item title is required" });
    }

    const pad = await Pad.findOne({ _id: padId, user: userId });
    if (!pad) return res.status(404).json({ error: "Pad not found" });

    const parsedStartDate = startDate ? new Date(startDate) : null;
    const parsedEndDate = endDate ? new Date(endDate) : null;

    if (startDate && Number.isNaN(parsedStartDate.getTime())) {
      return res.status(400).json({ error: "Invalid start date" });
    }

    if (endDate && Number.isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({ error: "Invalid end date" });
    }

    const newItem = {
      title: title.trim(),
      note: note?.trim() || "",
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      done: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    pad.items.push(newItem);
    pad.updatedAt = new Date();
    await pad.save();

    const addedItem = pad.items[pad.items.length - 1];
    return res.status(201).json({ item: addedItem });
  } catch (err) {
    console.error("POST /pads/:padId/items error:", err);
    return res.status(500).json({ error: "Failed to add item" });
  }
});

// PATCH /pads/:padId/items/:itemId - edit item title and/or note
router.patch("/:padId/items/:itemId", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { padId, itemId } = req.params;
    const { title, note, startDate, endDate } = req.body || {};

    if (title !== undefined && (typeof title !== "string" || !title.trim())) {
      return res.status(400).json({ error: "Item title cannot be empty" });
    }

    const pad = await Pad.findOne({ _id: padId, user: userId });
    if (!pad) return res.status(404).json({ error: "Pad not found" });

    const item = pad.items.id(itemId);
    if (!item) return res.status(404).json({ error: "Item not found" });

    if (title !== undefined) item.title = title.trim();
    if (note !== undefined) item.note = note.trim();

    if (startDate !== undefined) {
      const parsedStartDate = startDate ? new Date(startDate) : null;
      if (startDate && Number.isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({ error: "Invalid start date" });
      }
      item.startDate = parsedStartDate;
    }

    if (endDate !== undefined) {
      const parsedEndDate = endDate ? new Date(endDate) : null;
      if (endDate && Number.isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({ error: "Invalid end date" });
      }
      item.endDate = parsedEndDate;
    }
    item.updatedAt = new Date();
    pad.updatedAt = new Date();

    await pad.save();
    return res.status(200).json({ item });
  } catch (err) {
    console.error("PATCH /pads/:padId/items/:itemId error:", err);
    return res.status(500).json({ error: "Failed to update item" });
  }
});

// PATCH /pads/:padId/items/:itemId/toggle - toggle completion (done) status
router.patch("/:padId/items/:itemId/toggle", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { padId, itemId } = req.params;

    const pad = await Pad.findOne({ _id: padId, user: userId });
    if (!pad) return res.status(404).json({ error: "Pad not found" });

    const item = pad.items.id(itemId);
    if (!item) return res.status(404).json({ error: "Item not found" });

    item.done = !item.done;
    item.updatedAt = new Date();
    pad.updatedAt = new Date();

    await pad.save();
    return res.status(200).json({ item });
  } catch (err) {
    console.error("PATCH /pads/:padId/items/:itemId/toggle error:", err);
    return res.status(500).json({ error: "Failed to toggle item" });
  }
});

// DELETE /pads/:padId/items/:itemId - delete a single item from a pad
router.delete("/:padId/items/:itemId", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { padId, itemId } = req.params;

    const pad = await Pad.findOne({ _id: padId, user: userId });
    if (!pad) return res.status(404).json({ error: "Pad not found" });

    const item = pad.items.id(itemId);
    if (!item) return res.status(404).json({ error: "Item not found" });

    item.deleteOne();
    pad.updatedAt = new Date();
    await pad.save();

    return res.status(200).json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error("DELETE /pads/:padId/items/:itemId error:", err);
    return res.status(500).json({ error: "Failed to delete item" });
  }
});

module.exports = router;
