const mongoose = require("mongoose");

const VALID_EMOTIONS = ["happy", "calm", "neutral", "sad", "stressed", "angry", "tired", "excited"];

const emotionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  emotion: {
    type: String,
    enum: VALID_EMOTIONS,
    default: "neutral",
    required: true
  },
  lockedUntil: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
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

emotionSchema.index({ user: 1, date: 1 }, { unique: true });

emotionSchema.pre("save", function () {
  this.updatedAt = new Date();
});

module.exports = mongoose.model("Emotion", emotionSchema);