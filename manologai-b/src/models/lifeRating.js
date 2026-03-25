const mongoose = require("mongoose");

const lifeRatingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  week: {
    type: String,
    required: true, // e.g., '2026-W12' or ISO week
  },
  ratings: {
    partner: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    familyFriends: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    health: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    finances: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    career: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    physicalEnvironment: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    funRecreation: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    personalGrowth: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
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

// Compound index for unique user-week
lifeRatingSchema.index({ user: 1, week: 1 }, { unique: true });

// Update updatedAt on save
lifeRatingSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("LifeRating", lifeRatingSchema);
