import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

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
export const auth = getAuth(app);

let authPromise = null;

export const ensureAuth = async () => {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  if (!authPromise) {
    authPromise = signInAnonymously(auth)
      .then((res) => res.user)
      .catch((err) => {
        authPromise = null;
        throw err;
      });
  }
  return authPromise;
};

export default app;

