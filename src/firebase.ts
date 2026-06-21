import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getAuth } from "firebase/auth";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyC4u_WycoDv84P0dqzQtV0y2JD9n0du8-k",
  authDomain: "foodwasteai-8d074.firebaseapp.com",
  projectId: "foodwasteai-8d074",
  storageBucket: "foodwasteai-8d074.firebasestorage.app",
  messagingSenderId: "298988180962",
  appId: "1:298988180962:web:bb885bbefa2d3084e895bb",
};

// Initialize app only once
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

// Initialize Auth — use async storage for native, browser default for web
let auth;
if (Platform.OS !== "web") {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} else {
  auth = getAuth(app);
}

export { auth };

export const db = getFirestore(app);