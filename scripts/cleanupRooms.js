import admin from "firebase-admin";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

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
      process.exit(0); // Exit with success
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

    process.exit(0); // Exit after finishing
  } catch (error) {
    console.error("Error cleaning up rooms:", error);
    process.exit(1); // Exit with error code
  }
};

cleanupRooms();
