
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAhKtmT3gq1qV_Cmn49EcIi4SpBkWPIeZ4",
  authDomain: "remontprinterovorder.firebaseapp.com",
  projectId: "remontprinterovorder",
  storageBucket: "remontprinterovorder.firebasestorage.app",
  messagingSenderId: "597380565469",
  appId: "1:597380565469:web:dca8440086001758b78e34",
  measurementId: "G-NZWYFCRYPM"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const firebaseApp = app;
// Note: We are not initializing analytics here because it should only be done on the client side.
