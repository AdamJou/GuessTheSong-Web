// scripts/cleanupFinishedRooms.ts
import * as admin from "firebase-admin";

async function main() {
  try {
    // Wczytaj SERVICE_ACCOUNT z GitHub Secrets (base64-encoded)
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT || "";
    const serviceAccountJson = Buffer.from(
      serviceAccountBase64,
      "base64"
    ).toString("utf8");
    const serviceAccount = JSON.parse(serviceAccountJson);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL, // też w sekrecie
    });

    const db = admin.database();
    const roomsRef = db.ref("rooms");

    // Pobieramy wszystkie pokoje
    const snapshot = await roomsRef.once("value");

    if (!snapshot.exists()) {
      console.log("Brak pokoi do sprawdzenia.");
      return;
    }

    const updates: Record<string, null> = {};

    snapshot.forEach((child) => {
      const roomData = child.val();
      const roomKey = child.key;
      if (roomData && roomData.status === "finished" && roomKey) {
        // Przygotowujemy do usunięcia
        updates[roomKey] = null;
      }
    });

    if (Object.keys(updates).length > 0) {
      // Usuwamy wszystkie "finished" jednym wywołaniem
      await roomsRef.update(updates);
      console.log(`Usunięto pokoje: ${Object.keys(updates).join(", ")}`);
    } else {
      console.log("Brak pokoi ze statusem 'finished'.");
    }
  } catch (error) {
    console.error("Błąd podczas czyszczenia pokoi:", error);
    process.exit(1);
  }
}

main();
