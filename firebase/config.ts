// firebase/config.ts
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyASaul16ie1UeT9wjrCwbEwiCDVVCJZ7rA",
  authDomain: "campusloop-c13e6.firebaseapp.com",
  projectId: "campusloop-c13e6",
  storageBucket: "campusloop-c13e6.firebasestorage.app",
  messagingSenderId: "117016233590",
  appId: "1:117016233590:web:a2daf02a3b2e55bbf50157"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);