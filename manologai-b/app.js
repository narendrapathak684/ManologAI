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
const notificationRoutes = require("./src/routes/notifications");
const goalsRoutes = require("./src/routes/goals");
const { initPushScheduler } = require("./src/services/pushNotificationService");



const app = express();
const PORT = process.env.PORT || 4545;


const allowedOrigins = new Set([
"http://localhost:5173",
"http://127.0.0.1:5173",
"http://51.20.53.120",
"https://51.20.53.120",
...(process.env.FRONTEND_ORIGIN || "").
split(",").
map((origin) => origin.trim()).
filter(Boolean)]
);

app.use(
  cors({
    origin: (origin, callback) => {

      if (!origin) {
        return callback(null, true);
      }

      try {
        const { hostname, port, protocol } = new URL(origin);
        const isLocalhost =
        hostname === "localhost" || hostname === "127.0.0.1";
        const isPrivateLan =
        hostname.startsWith("192.168.") ||
        hostname.startsWith("10.") ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
        const isHttp = protocol === "http:";

        if ((isLocalhost || isPrivateLan) && isHttp) {
          return callback(null, true);
        }
      } catch (err) {

      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.get("/", (req, res) => {
  res.status(200).json({ message: "ManologAI backend is running" });
});

app.get("/api", (req, res) => {
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
app.use("/notifications", notificationRoutes);
app.use("/goals", goalsRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/diary", diaryRoutes);
app.use("/api/pads", padsRoutes);
app.use("/api/time-tracker", timeTrackerRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/life-ratings", lifeRatingsRoutes);
app.use("/api/emotions", emotionsRoutes);
app.use("/api/habits", habitsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/goals", goalsRoutes);



connectDB().
then(() => {
  console.log("database connection established");
  app.listen(PORT, () => {
    console.log(`server is listening on port ${PORT}`);
    initPushScheduler();
  });
}).
catch((err) => {
  console.error("Database connection failed", err);
  process.exit(1);
});
app.use("/naren", (req, res) => {
  res.send("hello i am narendra pathak");
});
