self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "ManologAI Reminder";


  let targetUrl = data.url || "/dashboard";

  const options = {
    body: data.body || "It's time for your daily check-in!",
    icon: "/logo.png",
    badge: "/logo.png",
    vibrate: [200, 100, 200],
    tag: data.tag || "manolog-push",
    data: { url: targetUrl }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {

      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});