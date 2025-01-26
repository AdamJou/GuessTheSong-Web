import router from "@/router";
import { useSessionStore } from "@/stores/session";
import { computed, ref, onMounted } from "vue";
import { getDatabase, get, ref as dbRef } from "firebase/database";
import { storeToRefs } from "pinia";
// Funkcja przekierowania na podstawie statusu gry

// Funkcja do pobrania statusu rundy z bazy danych lub API
const getRoundStatus = async (
  roomId: string,
  gameId: string,
  roundId: string
): Promise<string | null> => {
  try {
    const db = getDatabase();
    const roundRef = dbRef(
      db,
      `rooms/${roomId}/games/${gameId}/rounds/${roundId}/status`
    );

    // Pobieranie danych z Firebase
    const snapshot = await get(roundRef);

    if (snapshot.exists()) {
      return snapshot.val(); // Zwracamy rzeczywisty status rundy
    } else {
      console.warn("Status rundy nie istnieje dla podanych parametrów.");
      return null; // Jeśli nie ma statusu, zwracamy null
    }
  } catch (error) {
    console.error("Błąd podczas pobierania statusu rundy:", error);
    throw new Error("Nie udało się pobrać statusu rundy.");
  }
};
