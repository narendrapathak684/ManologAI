const express = require("express");
const router = express.Router();
const webpush = require("web-push");
const auth = require("../middleware/auth");
const User = require("../models/user");


webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);


router.post("/subscribe", auth, async (req, res) => {
  try {
    const subscription = req.body;
    const userId = req.user._id;


    await User.findByIdAndUpdate(userId, {
      $addToSet: { pushSubscriptions: subscription }
    });

    res.status(201).json({ message: "Subscription added successfully." });
  } catch (error) {
    console.error("Subscription error:", error);
    res.status(500).json({ error: "Failed to subscribe." });
  }
});


router.post("/unsubscribe", auth, async (req, res) => {
  try {
    const { endpoint } = req.body;
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, {
      $pull: { pushSubscriptions: { endpoint } }
    });

    res.status(200).json({ message: "Unsubscribed successfully." });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    res.status(500).json({ error: "Failed to unsubscribe." });
  }
});


router.post("/test", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return res.status(400).json({ error: "No active push subscriptions found." });
    }

    const payload = JSON.stringify({
      title: "ManologAI Test",
      body: "Everything is working! Your browser push notifications are active."
    });


    const results = await Promise.allSettled(
      user.pushSubscriptions.map((sub) => webpush.sendNotification(sub, payload))
    );


    const expiredEndpoints = results.
    filter((r) => r.status === "rejected" && (r.reason.statusCode === 410 || r.reason.statusCode === 404)).
    map((r, i) => user.pushSubscriptions[i].endpoint);

    if (expiredEndpoints.length > 0) {
      await User.findByIdAndUpdate(userId, {
        $pull: { pushSubscriptions: { endpoint: { $in: expiredEndpoints } } }
      });
    }

    res.status(200).json({ message: "Test notification sent.", results });
  } catch (error) {
    console.error("Push test error:", error);
    res.status(500).json({ error: "Failed to send test push." });
  }
});


router.patch("/settings", auth, async (req, res) => {
  try {
    const { settings } = req.body;
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, {
      $set: { reminderSettings: settings }
    });

    res.status(200).json({ message: "Settings updated successfully." });
  } catch (error) {
    console.error("Settings update error:", error);
    res.status(500).json({ error: "Failed to update settings." });
  }
});

module.exports = router;