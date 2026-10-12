importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyB0d7BqDuoYu6viwrZEHWX4n8YItFXm83A",
  authDomain: "avalift-740dd.firebaseapp.com",
  projectId: "avalift-740dd",
  storageBucket: "avalift-740dd.firebasestorage.app",
  messagingSenderId: "702151567835",
  appId: "1:702151567835:web:515f3eebf7547890811ffe",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  let title = 'Default Title';
  let body = 'Default body content.';
  let click_action = '#';

  // If the payload includes a notification object, use its title and body
  if (payload.notification) {
    if (payload.notification.title) title = payload.notification.title;
    if (payload.notification.body) body = payload.notification.body;
  }

  // If the payload includes data fields, override the title, body, and click_action if present
  if (payload.data) {
    if (payload.data.title) title = payload.data.title;
    if (payload.data.body) body = payload.data.body;
    if (payload.data.click_action) click_action = payload.data.click_action;
  }

  const notificationOptions = {
    body: body,
    icon: '/logo.png',
    data: {
      click_action: click_action,
    },
  };

  self.registration.showNotification(title, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.click_action)
  );
});
