import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
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

// Initialize Auth only once — NO getAuth() anywhere

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);