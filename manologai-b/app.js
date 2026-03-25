require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./src/config/database");
const authRoutes = require("./src/routes/auth");

const app = express();
const PORT = process.env.PORT || 4545;

// Built-in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Basic routes
app.get("/", (req, res) => {
  res.status(200).json({ message: "ManologAI backend is running" });
});

app.use("/api/auth", authRoutes);

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
