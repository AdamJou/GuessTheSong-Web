import { ref, watch, computed } from "vue";
import {
  getDatabase,
  ref as dbRef,
  onValue,
  off,
  update,
} from "firebase/database";
import { useSessionStore } from "@/stores/session";
import type { Player } from "@/types/types";

export function usePlayerReady() {
  const sessionStore = useSessionStore();

  const roomId = computed(() => sessionStore.roomId);
  const players = ref<Record<string, Player>>({});
  const allPlayersReady = ref(false);

  let unsubscribePlayers: (() => void) | null = null;

  // ✅ **Nasłuchuje WSZYSTKICH GRACZY I AKTUALIZUJE `allPlayersReady` W REAL-TIME!**
  const subscribeToPlayersReady = () => {
    if (!roomId.value) return;

    const db = getDatabase();
    const playersRef = dbRef(db, `rooms/${roomId.value}/players`);

    unsubscribeFromPlayersReady(); // Jeśli jest sub, usuń

    unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      players.value = data ? data : {};

      // LOG sprawdzający czy Firebase nasłuchuje
      console.log("🔥 Real-time update: Gracze:", players.value);

      // Sprawdzamy gotowość graczy
      const playerKeys = Object.keys(players.value);
      allPlayersReady.value =
        playerKeys.length > 0 &&
        playerKeys.every((id) => players.value[id]?.ready === true);

      console.log("⚡️ Status allPlayersReady:", allPlayersReady.value);
    });
  };

  const unsubscribeFromPlayersReady = () => {
    if (unsubscribePlayers) {
      unsubscribePlayers();
      unsubscribePlayers = null;
    }
  };

  // ✅ **Ustawienie `ready: true` dla bieżącego gracza**
  const setCurrentPlayerReady = async () => {
    if (!roomId.value || !sessionStore.playerId) {
      console.error("Brak wymaganych wartości:", {
        roomId: roomId.value,
        playerId: sessionStore.playerId,
      });
      return;
    }

    const db = getDatabase();
    const playerRef = dbRef(
      db,
      `rooms/${roomId.value}/players/${sessionStore.playerId}`
    );

    try {
      await update(playerRef, { ready: true });
      console.log(
        `✅ Ustawiono ready: true dla gracza ${sessionStore.playerId}`
      );
    } catch (error) {
      console.error("❌ Błąd przy ustawianiu ready:", error);
    }
  };

  // ✅ **Resetuje gotowość wszystkich graczy na `false`**
  const resetReadyStatus = async () => {
    if (!roomId.value) return;
    const db = getDatabase();
    const playersRef = dbRef(db, `rooms/${roomId.value}/players`);

    const updates: Record<string, boolean> = {};
    for (const id in players.value) {
      updates[`${id}/ready`] = false;
    }

    console.log("🔄 Resetowanie gotowości graczy:", updates);
    await update(playersRef, updates);
  };

  // ✅ **Automatycznie subskrybuje, kiedy zmienia się `roomId`**
  watch(
    roomId,
    (newRoomId) => {
      if (newRoomId) {
        subscribeToPlayersReady();
      } else {
        unsubscribeFromPlayersReady();
      }
    },
    { immediate: true }
  );

  return {
    players,
    allPlayersReady,
    subscribeToPlayersReady,
    unsubscribeFromPlayersReady,
    setCurrentPlayerReady,
    resetReadyStatus,
  };
}
