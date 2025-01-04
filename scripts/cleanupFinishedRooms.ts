import * as admin from "firebase-admin";

async function main() {
  try {
    console.log("Uruchamianie cleanup script...");

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT || "";
    console.log(
      "Długość FIREBASE_SERVICE_ACCOUNT JSON:",
      serviceAccountJson.length
    );

    if (!serviceAccountJson) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT jest puste! Ustaw sekret w GitHub Actions."
      );
    }

    // Parsowanie JSON-a
    let serviceAccount: any;
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (err) {
      throw new Error(
        "Błąd parsowania JSON-a: " +
          (err instanceof Error ? err.message : String(err))
      );
    }

    // Ręczne przekazanie danych do certyfikatu Firebase
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.project_id,
        privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
        clientEmail: serviceAccount.client_email,
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
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
