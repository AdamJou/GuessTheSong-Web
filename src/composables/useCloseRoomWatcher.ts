import { computed, onMounted, onUnmounted } from "vue";
import { useSessionStore } from "@/stores/session";
import { useRouter } from "vue-router";
import { getDatabase, ref as dbRef, onValue, update } from "firebase/database";

/**
 * Ten composable uruchamia nasłuch na /rooms/{roomId}.
 * Jeśli pokój zostanie usunięty, lokalny gracz sam ustawia currentGame=""
 * w /players/{auth.uid}/currentGame (do czego ma prawo),
 * czyści store i przechodzi do /home.
 */
export function useRoomWatcher() {
  const sessionStore = useSessionStore();
  const router = useRouter();

  const roomId = computed(() => sessionStore.roomId);
  const playerId = computed(() => sessionStore.playerId);

  let unsubscribe: (() => void) | null = null;

  /**
   * Funkcja uruchamia nasłuch (onValue) na ścieżkę /rooms/{roomId}.
   * Gdy snapshot nie istnieje -> pokój usunięty -> reset i powrót do home.
   */
  function watchRoomRemoved() {
    if (!roomId.value) {
      console.log("[watchRoomRemoved] Brak roomId => nie nasłuchuję");
      return;
    }
    console.log("[watchRoomRemoved] Start nasłuchu /rooms/", roomId.value);

    const db = getDatabase();
    const roomRef = dbRef(db, `rooms/${roomId.value}`);

    // Wywołujemy onValue
    unsubscribe = onValue(
      roomRef,
      async (snapshot) => {
        // Gdy pokój jest usunięty -> snapshot.exists() == false
        if (!snapshot.exists()) {
          console.warn(
            "Pokój usunięty! Resetuję currentGame i wracam do /home."
          );

          // Ustawiamy currentGame="" TYLKO sobie (mamy prawo do /players/{playerId}).
          if (playerId.value) {
            await update(dbRef(db, `players/${playerId.value}`), {
              currentGame: "",
            });
          }

          // Czyścimy store (roomId, subskrypcje)
          sessionStore.clearRoomId();

          // Przenosimy się do /home
          router.push("/home");
        }
      },
      (error) => {
        console.error("[watchRoomRemoved] Błąd onValue:", error);
      }
    );
  }

  /**
   * Funkcja odpinająca nasłuch (jeśli istnieje).
   */
  function unwatchRoomRemoved() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }

  return {
    watchRoomRemoved,
    unwatchRoomRemoved,
  };
}
