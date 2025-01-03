import * as admin from "firebase-admin";

// Pobierz klucz serwisowy z sekreta środowiskowego
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://guessthesongweb-default-rtdb.europe-west1.firebasedatabase.app",
});

const db = admin.database();

async function cleanFinishedRooms() {
  const roomsRef = db.ref("rooms");
  const snapshot = await roomsRef.once("value");

  if (!snapshot.exists()) {
    console.log("Brak pokoi do wyczyszczenia.");
    return;
  }

  const rooms = snapshot.val();
  const updates: Record<string, null> = {};

  Object.entries(rooms).forEach(([roomId, roomData]: [string, any]) => {
    if (roomData.status === "finished") {
      console.log(`Usuwam pokój ${roomId} o statusie "finished".`);
      updates[roomId] = null; // Realtime Database: null oznacza usunięcie węzła
    }
  });

  if (Object.keys(updates).length > 0) {
    await roomsRef.update(updates);
    console.log("Usunięto pokoje ze statusem 'finished'.");
  } else {
    console.log("Nie znaleziono pokoi do usunięcia.");
  }
}

cleanFinishedRooms()
  .then(() => {
    console.log("Zakończono czyszczenie pokoi.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Błąd podczas czyszczenia pokoi:", error);
    process.exit(1);
  });
