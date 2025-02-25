import router from "@/router";
import { useSessionStore } from "@/stores/session";
import { computed, ref, onMounted } from "vue";
import { getDatabase, get, ref as dbRef } from "firebase/database";
import { storeToRefs } from "pinia";

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

    const snapshot = await get(roundRef);

    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.warn("Status rundy nie istnieje dla podanych parametrów.");
      return null;
    }
  } catch (error) {
    console.error("Błąd podczas pobierania statusu rundy:", error);
    throw new Error("Nie udało się pobrać statusu rundy.");
  }
};
