const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ManologAI";
  await mongoose.connect(mongoUri);
};

module.exports = connectDB;