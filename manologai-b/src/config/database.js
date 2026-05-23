const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri =
  process.env.MONGODB_URI;
  await mongoose.connect(mongoUri);
};

module.exports = connectDB;