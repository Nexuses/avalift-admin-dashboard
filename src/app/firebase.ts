// firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCFh2AJF-tqr6RzsZumzPkxxxxxx",
  authDomain: "zeizzu-new-xxxx.firebaseapp.com",
  projectId: "zeizzu-new-xxxx",
  storageBucket: "zeizzu-new-xxxx.firebasestorage.app",
  messagingSenderId: "149315xxx151",
  appId: "1:149315xxx51:web:57cd3b98cb58f537c42d5a",
  measurementId: "G-2Fxx25C2VM",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { analytics };
