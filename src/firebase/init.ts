import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_CONFIG_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_CONFIG_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_CONFIG_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_CONFIG_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_CONFIG_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_CONFIG_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_CONFIG_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_CONFIG_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

// Inicjalizacja bazy danych
export const database = getDatabase(app);

// Opcjonalne: Inicjalizacja App Check
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(import.meta.env.VITE_APP_CHECK_SITE_KEY),
  isTokenAutoRefreshEnabled: false, // Tymczasowo wyłącz automatyczne odświeżanie
});

export { app, appCheck };
