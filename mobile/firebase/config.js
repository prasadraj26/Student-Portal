import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Same Firebase project as the web teacher app
const firebaseConfig = {
  apiKey:            "AIzaSyDVzeeaahAqnd361GvyndsmLrHXWMYYDEI",
  authDomain:        "student-portal-9c22b.firebaseapp.com",
  projectId:         "student-portal-9c22b",
  storageBucket:     "student-portal-9c22b.firebasestorage.app",
  messagingSenderId: "72566719486",
  appId:             "1:72566719486:web:9fa58a7a3dcfb647bd36af",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export default app;
