import { api } from "./api";

const NOTIFICATION_ICON = "/logo.png";
const VAPID_PUBLIC_KEY = "BCtUqMA5nvCbkYA61vMf8OakEptRY58KeH6rckI0s3o75RFQjwCTpwiX_YKFkuj513Oa4lCsGzFs1GVko6qWpO4";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.error("This browser does not support notifications.");
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission === "granted") {

    await subscribeUserToPush();
  }
  return permission === "granted";
};

export const subscribeUserToPush = async () => {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });


    await api.post("/notifications/subscribe", subscription);
    console.log("Push subscription successful.");
    return true;
  } catch (err) {
    console.error("Push subscription failed:", err);
    return false;
  }
};

export const showNotification = (title, body, tag = "manolog-reminder") => {
  if (Notification.permission === "granted") {
    const urlMap = {
      habits: "/track",
      journal: "/journal",
      tracking: "/track",
      dailyLog: "/dashboard",
      "manolog-reminder": "/dashboard"
    };
    const targetUrl = urlMap[tag] || "/dashboard";


    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: NOTIFICATION_ICON,
          vibrate: [200, 100, 200],
          tag,
          badge: NOTIFICATION_ICON,
          data: { url: targetUrl }
        });
      });
    } else {

      const notification = new Notification(title, {
        body,
        icon: NOTIFICATION_ICON,
        tag
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = targetUrl;
        notification.close();
      };
    }
  }
};

export const scheduleReminders = (reminders) => {

  localStorage.setItem("manolog_reminders", JSON.stringify(reminders));
};

export const checkAndTriggerReminders = () => {
  const remindersJson = localStorage.getItem("manolog_reminders");
  if (!remindersJson) return;

  const reminders = JSON.parse(remindersJson);
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;


  Object.keys(reminders).forEach((id) => {
    const reminder = reminders[id];
    if (reminder.enabled && reminder.time === currentTime) {
      const lastTriggered = localStorage.getItem(`last_triggered_${id}`);
      const today = now.toDateString();

      if (lastTriggered !== today) {
        showNotification(reminder.title, reminder.body, id);
        localStorage.setItem(`last_triggered_${id}`, today);
      }
    }
  });
};