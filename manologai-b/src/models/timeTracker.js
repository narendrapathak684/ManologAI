const mongoose = require("mongoose");

const timeTrackerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  sleep: {
    type: Number,
    min: 0,
    default: 0,
  },
  screen: {
    type: Number,
    min: 0,
    default: 0,
  },
  workStudy: {
    type: Number,
    min: 0,
    default: 0,
  },
  expense: {
    type: Number,
    min: 0,
    default: 0,
  },
  locked: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for unique user-date
timeTrackerSchema.index({ user: 1, date: 1 }, { unique: true });

// Update updatedAt on save
timeTrackerSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("TimeTracker", timeTrackerSchema);
