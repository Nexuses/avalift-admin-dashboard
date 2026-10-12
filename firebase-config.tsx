import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { toast } from "sonner";

const firebaseConfig = {
  apiKey: "AIzaSyB0d7BqDuoYu6viwrZEHWX4n8YItFXm83A",
  authDomain: "avalift-740dd.firebaseapp.com",
  projectId: "avalift-740dd",
  storageBucket: "avalift-740dd.firebasestorage.app",
  messagingSenderId: "702151567835",
  appId: "1:702151567835:web:515f3eebf7547890811ffe",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

/**
 * Function to request permission for push notifications and get FCM token
 */
export const requestFirebaseNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const currentToken = await getToken(messaging, {
        vapidKey:
          "BENQH03-8y4QsTJe5l1CRNlM--gEA6Ae6TH913ELv7AknkQhaLjwNSHfO8d3HsIeHqzZ6ByHUkPZ9KTYRMJoJ2Y",
      });

      if (currentToken) {
        console.log("FCM Token successfully retrieved:", currentToken);
        localStorage.setItem("fcmToken", currentToken);
        return currentToken;
      } else {
        console.error(
          "No registration token available. Request permission to generate one."
        );
      }
    } else {
      console.error("Notification permission denied.");
    }
  } catch (error) {
    console.error("An error occurred while retrieving token:", error);
    throw error;
  }
};

/**
 * Listener for receiving messages when the application is in the foreground
 */
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("Foreground message received:", payload);

      let title = payload.notification?.title || "New Notification";
      let body = payload.notification?.body || "You have a new message.";

      // Play the notification sound
      const audio = new Audio("/default.wav"); // Path relative to public folder
      audio.play().catch((error) => {
        console.error("Error playing notification sound:", error);
      });

      // Show Sonner toast notification
      toast.message(title, {
        description: body,
        duration: 5000, // 5000ms = 5 seconds
      });

      // Show a native browser notification
      if (Notification.permission === "granted") {
        new Notification(title, {
          body: body,
          icon: "/logo.png",
        });
      }

      resolve(payload);
    });
  });