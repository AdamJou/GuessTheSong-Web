import * as admin from "firebase-admin";

async function main() {
  try {
    console.log("Uruchamianie cleanup script...");

    // Wczytaj SERVICE_ACCOUNT z GitHub Secrets (czysty JSON)
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT || "";
    console.log(
      "Długość FIREBASE_SERVICE_ACCOUNT JSON:",
      serviceAccountJson.length
    );

    if (!serviceAccountJson) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT jest puste! Upewnij się, że sekret jest poprawnie ustawiony."
      );
    }

    // Parsowanie JSON
    const serviceAccount = JSON.parse(serviceAccountJson);

    // Inicjalizacja Firebase
    console.log("Inicjalizacja Firebase...");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL, // też w sekrecie
    });

    console.log("Połączenie z Firebase Realtime Database...");
    const db = admin.database();
    const roomsRef = db.ref("rooms");

    console.log("Pobieranie danych z bazy...");
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
      console.log(
        `Znaleziono ${
          Object.keys(updates).length
        } pokoje do usunięcia. Rozpoczynam usuwanie...`
      );
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
