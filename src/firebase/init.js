import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyATegquNqoUt700y_dGZwTMOSiA9iOhRHI",
    authDomain: "guessthesongweb.firebaseapp.com",
    databaseURL: "https://guessthesongweb-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "guessthesongweb",
    storageBucket: "guessthesongweb.firebasestorage.app",
    messagingSenderId: "484312113292",
    appId: "1:484312113292:web:118fa7f78ef981bdb8dba9",
    measurementId: "G-CZW4ZNTFWQ",
};
const app = initializeApp(firebaseConfig);
// Inicjalizacja bazy danych
export const database = getDatabase(app);
// Opcjonalne: Inicjalizacja App Check
const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider("6LcOsKQqAAAAACYIUirz6DX0uuK-H6POZrkuUHQ2"),
    isTokenAutoRefreshEnabled: false, // Tymczasowo wyłącz automatyczne odświeżanie
});
export { app, appCheck };
