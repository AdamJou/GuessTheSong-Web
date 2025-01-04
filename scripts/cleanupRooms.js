import admin from "firebase-admin";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();
console.log("FIREBASE_SERVICE_ACCOUNT:", process.env.FIREBASE_SERVICE_ACCOUNT);
console.log("FIREBASE_DATABASE_URL:", process.env.FIREBASE_DATABASE_URL);
// Parse Firebase service account credentials
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

const db = admin.database();

const cleanupRooms = async () => {
  try {
    const snapshot = await db.ref("/rooms").once("value");
    const rooms = snapshot.val();

    if (!rooms) {
      console.log("No rooms found.");
      return;
    }

    const updates = {};

    Object.keys(rooms).forEach((roomId) => {
      if (rooms[roomId].status === "finished") {
        updates[`/rooms/${roomId}`] = null;
      }
    });

    if (Object.keys(updates).length > 0) {
      await db.ref().update(updates);
      console.log("Deleted all finished rooms.");
    } else {
      console.log("No finished rooms to delete.");
    }
  } catch (error) {
    console.error("Error cleaning up rooms:", error);
  }
};

cleanupRooms();
