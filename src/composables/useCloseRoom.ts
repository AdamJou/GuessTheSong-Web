import { computed } from "vue";
import { getDatabase, ref as dbRef, update } from "firebase/database";
import { useSessionStore } from "@/stores/session";
import { useRouter } from "vue-router";

/**
 * Composable do usuwania całego pokoju przez DJ-a.
 * Nie rusza danych innych graczy — oni sami wykryją usunięcie
 * i ustawią currentGame="" we własnym zakresie.
 */
export function useCloseRoom() {
  const sessionStore = useSessionStore();
  const router = useRouter();

  // ID pokoju i DJ-a z store
  const roomId = computed(() => sessionStore.roomId);
  const djId = computed(() => sessionStore.djId);

  // Sprawdzamy, czy nasz user to DJ
  const isDj = computed(() => sessionStore.playerId === djId.value);

  /**
   * Główna funkcja zamykająca pokój (usuwa /rooms/{roomId}),
   * a także czyści "currentGame" TYLKO DJ-owi (bo do siebie ma prawo).
   * Reszta graczy sama wykryje brak pokoju.
   */
  async function closeRoom() {
    if (!roomId.value) {
      console.error("Brak roomId, nie można usunąć pokoju.");
      return;
    }

    try {
      const db = getDatabase();
      const updates: Record<string, any> = {};

      // 1) Usuwamy cały /rooms/{roomId}
      updates[`rooms/${roomId.value}`] = null;

      // 2) DJ może wyczyścić SWÓJ currentGame
      // (Nie dotykamy players/{innychUID}/currentGame)
      updates[`players/${sessionStore.playerId}/currentGame`] = "";

      await update(dbRef(db), updates);

      // Czyścimy w store i przenosimy DJ-a np. do /home
      sessionStore.clearRoomId();
      router.push("/home");

      console.log(`Pokój ${roomId.value} usunięty przez DJ-a.`);
    } catch (error) {
      console.error("Błąd przy zamykaniu pokoju:", error);
      alert("Wystąpił błąd przy usuwaniu pokoju. Spróbuj ponownie.");
    }
  }

  return {
    closeRoom,
  };
}
