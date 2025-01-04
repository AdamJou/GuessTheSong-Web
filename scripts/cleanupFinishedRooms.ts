import * as admin from "firebase-admin";

async function main() {
  try {
    console.log("Uruchamianie cleanup script...");

    // Pobierz SERVICE_ACCOUNT z GitHub Secrets
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

    // Dekodowanie i parsowanie JSON-a
    let serviceAccount: any;
    try {
      if (serviceAccountJson.trim().startsWith("{")) {
        console.log("Parsowanie JSON-a...");
        serviceAccount = JSON.parse(serviceAccountJson);
      } else {
        console.log("Dekodowanie JSON-a z Base64...");
        const decodedJson = Buffer.from(serviceAccountJson, "base64").toString(
          "utf8"
        );
        serviceAccount = JSON.parse(decodedJson);
      }
    } catch (err) {
      throw new Error(
        "Błąd parsowania JSON-a z FIREBASE_SERVICE_ACCOUNT: " +
          (err instanceof Error ? err.message : String(err))
      );
    }

    // Walidacja kluczowych pól w JSON-ie
    if (!serviceAccount.private_key || !serviceAccount.client_email) {
      console.error("Zawartość JSON-a:");
      console.dir(serviceAccount, { depth: null });
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT jest niekompletny! Upewnij się, że zawiera 'private_key' i 'client_email'."
      );
    }

    // Inicjalizacja Firebase
    console.log("Inicjalizacja Firebase...");
    admin.initializeApp({
      credential: admin.credential.cert({
        privateKey: serviceAccount.private_key,
        clientEmail: serviceAccount.client_email,
        projectId: serviceAccount.project_id,
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL, // Ustaw również w sekrecie
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
        updates[roomKey] = null;
      }
    });

    if (Object.keys(updates).length > 0) {
      console.log(
        `Znaleziono ${
          Object.keys(updates).length
        } pokoje do usunięcia. Rozpoczynam usuwanie...`
      );
      await roomsRef.update(updates);
      console.log(`Usunięto pokoje: ${Object.keys(updates).join(", ")}`);
    } else {
      console.log("Brak pokoi ze statusem 'finished'.");
    }
  } catch (error) {
    console.error(
      "Błąd podczas czyszczenia pokoi:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

main();
