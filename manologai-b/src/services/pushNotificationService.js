const webpush = require("web-push");
const User = require("../models/user");

// Configure web-push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const sendPushNotification = async (subscription, payload) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription has expired or is no longer valid
      return { expired: true, endpoint: subscription.endpoint };
    }
    console.error("Error sending push notification:", error);
  }
  return { expired: false };
};

const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    const currentHour = String(now.getUTCHours()).padStart(2, "0");
    const currentMinute = String(now.getUTCMinutes()).padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}`;

    // For simplicity, we are checking against UTC time. 
    // In a production app, we would calculate this based on user's timezone.
    
    const users = await User.find({
      $or: [
        { "reminderSettings.habits.enabled": true, "reminderSettings.habits.time": currentTime },
        { "reminderSettings.journal.enabled": true, "reminderSettings.journal.time": currentTime },
        { "reminderSettings.tracking.enabled": true, "reminderSettings.tracking.time": currentTime },
        { "reminderSettings.dailyLog.enabled": true, "reminderSettings.dailyLog.time": currentTime }
      ],
      isDeleted: false,
      "pushSubscriptions.0": { $exists: true }
    });

    for (const user of users) {
      let title, body;
      
      if (user.reminderSettings.dailyLog && user.reminderSettings.dailyLog.enabled && user.reminderSettings.dailyLog.time === currentTime) {
        title = "ManologAI";
        body = "Don't forget to log your day! Consistency is key. 🚀";
      } else if (user.reminderSettings.habits.enabled && user.reminderSettings.habits.time === currentTime) {
        title = "Habit Check-in";
        body = "Time to log your daily habits!";
      } else if (user.reminderSettings.journal.enabled && user.reminderSettings.journal.time === currentTime) {
        title = "Journaling Session";
        body = "Write down your thoughts for today.";
      } else {
        title = "Expense Tracking";
        body = "Did you track your expenses today?";
      }

      const payload = { title, body };
      const expiredEndpoints = [];

      for (const sub of user.pushSubscriptions) {
        const result = await sendPushNotification(sub, payload);
        if (result.expired) expiredEndpoints.push(result.endpoint);
      }

      if (expiredEndpoints.length > 0) {
        await User.findByIdAndUpdate(user._id, {
          $pull: { pushSubscriptions: { endpoint: { $in: expiredEndpoints } } }
        });
      }
    }
  } catch (error) {
    console.error("Scheduler error:", error);
  }
};

const initPushScheduler = () => {
  console.log("Push Notification Scheduler started.");
  // Run every minute
  setInterval(checkAndSendReminders, 60000);
};

module.exports = { initPushScheduler, sendPushNotification };
