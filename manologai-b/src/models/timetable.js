const mongoose = require("mongoose");

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const blockSchema = new mongoose.Schema({
  groupId: {
    type: String,
    default: null
  },
  day: {
    type: String,
    enum: DAYS,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  activity: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const timetableSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  blocks: [blockSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

timetableSchema.pre("save", function () {
  this.updatedAt = new Date();
});

module.exports = mongoose.model("Timetable", timetableSchema);