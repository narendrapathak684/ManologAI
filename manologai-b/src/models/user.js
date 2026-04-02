const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  profile: {
    type: Object,
    default: {},
  },
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  country: {
    type: String,
    trim: true,
  },
  currency: {
    type: String,
    trim: true,
    uppercase: true,
    minlength: 3,
    maxlength: 3,
  },
  habits: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Habit",
    },
  ],
  streaks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Streak",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
