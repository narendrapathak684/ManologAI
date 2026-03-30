const mongoose = require("mongoose");

const dailyEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  text: {
    type: String,
    default: "",
  },
  rating: {
    type: Number,
    min: 0,
    max: 10,
    default: null,
  },
  metrics: {
    type: Object,
    default: {},
  },
  lockedUntil: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for unique user-date
dailyEntrySchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailyEntry", dailyEntrySchema);
