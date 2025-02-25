import { computed, onMounted, onUnmounted } from "vue";
import { useSessionStore } from "@/stores/session";
import { useRouter } from "vue-router";
import { getDatabase, ref as dbRef, onValue, update } from "firebase/database";

export function useRoomWatcher() {
  const sessionStore = useSessionStore();
  const router = useRouter();

  const roomId = computed(() => sessionStore.roomId);
  const playerId = computed(() => sessionStore.playerId);

  let unsubscribe: (() => void) | null = null;

  function watchRoomRemoved() {
    if (!roomId.value) {
      console.log("[watchRoomRemoved] Brak roomId => nie nasłuchuję");
      return;
    }
    console.log("[watchRoomRemoved] Start nasłuchu /rooms/", roomId.value);

    const db = getDatabase();
    const roomRef = dbRef(db, `rooms/${roomId.value}`);

    unsubscribe = onValue(
      roomRef,
      async (snapshot) => {
        if (!snapshot.exists()) {
          console.warn(
            "Pokój usunięty! Resetuję currentGame i wracam do /home."
          );

          if (playerId.value) {
            await update(dbRef(db, `players/${playerId.value}`), {
              currentGame: "",
            });
          }

          sessionStore.clearRoomId();

          router.push("/home");
        }
      },
      (error) => {
        console.error("[watchRoomRemoved] Błąd onValue:", error);
      }
    );
  }

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
