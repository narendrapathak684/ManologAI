require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDB = require("./src/config/database");
const authRoutes = require("./src/routes/auth");
const profileRoutes = require("./src/routes/profile");
const diaryRoutes = require("./src/routes/diary");
const padsRoutes = require("./src/routes/pads");
const timeTrackerRoutes = require("./src/routes/timeTracker");
const timetableRoutes = require("./src/routes/timetable");
const lifeRatingsRoutes = require("./src/routes/lifeRatings");
const emotionsRoutes = require("./src/routes/emotions");
const habitsRoutes = require("./src/routes/habits");

const app = express();
const PORT = process.env.PORT || 4545;

// Built-in middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true })); // Adjust frontend URL as needed
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Basic routes
app.get("/", (req, res) => {
  res.status(200).json({ message: "ManologAI backend is running" });
});

app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/diary", diaryRoutes);
app.use("/pads", padsRoutes);
app.use("/time-tracker", timeTrackerRoutes);
app.use("/timetable", timetableRoutes);
app.use("/life-ratings", lifeRatingsRoutes);
app.use("/emotions", emotionsRoutes);
app.use("/habits", habitsRoutes);

// Database connection + server start
connectDB()
  .then(() => {
    console.log("database connection established");
    app.listen(PORT, () => {
      console.log(`server is listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed", err);
    process.exit(1);
  });
app.use("/naren", (req, res) => {
  res.send("hello i am narendra pathak");
});
