const mongoose = require("mongoose");

const lifeRatingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  ratings: {
    partner: {
      type: Number,
      min: 0,
      max: 10,
      default: null
    },
    familyFriends: {
      type: Number,
      min: 0,
      max: 10,
      default: null
    },
    health: {
      type: Number,
      min: 0,
      max: 10,
      default: null
    },
    finances: {
      type: Number,
      min: 0,
      max: 10,
      default: null
    },
    career: {
      type: Number,
      min: 0,
      max: 10,
      default: null
    },
    physicalEnvironment: {
      type: Number,
      min: 0,
      max: 10,
      default: null
    },
    funRecreation: {
      type: Number,
      min: 0,
      max: 10,
      default: null
    },
    personalGrowth: {
      type: Number,
      min: 0,
      max: 10,
      default: null
    }
  },
  locked: {
    type: Boolean,
    default: false
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


lifeRatingSchema.index({ user: 1, date: 1 }, { unique: true });


lifeRatingSchema.pre("save", function () {
  this.updatedAt = new Date();
});

module.exports = mongoose.model("LifeRating", lifeRatingSchema);