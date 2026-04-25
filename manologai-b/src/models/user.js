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
    maxlength: 30,
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 30,
  },
  profilePicture: {
    url: {
      type: String,
      trim: true,
      default: "",
    },
    publicId: {
      type: String,
      trim: true,
      default: "",
    },
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
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  pushSubscriptions: [
    {
      endpoint: String,
      keys: {
        p256dh: String,
        auth: String,
      },
    },
  ],
  reminderSettings: {
    habits: {
      enabled: { type: Boolean, default: false },
      time: { type: String, default: "09:00" },
    },
    journal: {
      enabled: { type: Boolean, default: false },
      time: { type: String, default: "21:00" },
    },
    tracking: {
      enabled: { type: Boolean, default: false },
      time: { type: String, default: "13:00" },
    },
    dailyLog: {
      enabled: { type: Boolean, default: true }, // Default to true as it's a core feature
      time: { type: String, default: "20:00" },
    },
    timezone: { type: String, default: "UTC" },
  },
  goals: {
    sleep: { type: Number, default: 8 }, // hours
    screenTime: { type: Number, default: 3 }, // hours
    work: { type: Number, default: 6 }, // hours
    expenses: { type: Number, default: 50 }, // currency units
  },
  sessions: [
    {
      token: String,
      userAgent: String,
      ip: String,
      lastActive: { type: Date, default: Date.now },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
