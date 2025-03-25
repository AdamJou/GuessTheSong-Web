import { useRouter } from "vue-router";
import { getDatabase, ref as dbRef, get } from "firebase/database";
import { useSessionStore } from "@/stores/session";

export function useGameStateManager() {
  const router = useRouter();
  const sessionStore = useSessionStore();

  const fetchRoundStatus = async () => {
    if (
      !sessionStore.roomId ||
      !sessionStore.currentGame ||
      !sessionStore.currentRound
    ) {
      console.warn("Brak danych do pobrania roundStatus.");
      return null;
    }

    const db = getDatabase();
    const roundStatusRef = dbRef(
      db,
      `rooms/${sessionStore.roomId}/games/${sessionStore.currentGame}/rounds/${sessionStore.currentRound}/status`
    );

    try {
      const snapshot = await get(roundStatusRef);
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        console.warn("[App] roundStatus nie istnieje w bazie.");
        return null;
      }
    } catch (error) {
      console.error("[App] Błąd pobierania roundStatus:", error);
      return null;
    }
  };

  const fetchDjId = async (roomId: string): Promise<string | null> => {
    if (!roomId) {
      console.warn("Brak roomId, nie można pobrać djId.");
      return null;
    }

    const db = getDatabase();
    const djRef = dbRef(db, `rooms/${roomId}/djId`);

    try {
      const snapshot = await get(djRef);
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        console.warn("[fetchDjId] djId nie istnieje w bazie.");
        return null;
      }
    } catch (error) {
      console.error("[fetchDjId] Błąd pobierania djId:", error);
      return null;
    }
  };

  const redirectToCurrentGameState = async (
    gameStatus: string,
    roundStatus: string | null
  ) => {
    if (!sessionStore.roomId) return;

    // Ensure we have the latest djId
    const djId = await fetchDjId(sessionStore.roomId);
    if (djId) {
      sessionStore.djId = djId;
    }

    switch (gameStatus) {
      case "waiting":
        await router.replace({
          name: "Lobby",
          params: { roomId: sessionStore.roomId },
        });
        break;
      case "song_selection":
        await router.replace({
          name: "SongSelection",
          params: { roomId: sessionStore.roomId },
        });
        break;
      case "voting":
        if (sessionStore.playerId !== sessionStore.djId) {
          await router.replace({
            name: "Voting",
            params: { roomId: sessionStore.roomId },
          });
        } else {
          if (
            roundStatus === "waiting" ||
            roundStatus === "completed" ||
            roundStatus === "song_selection"
          ) {
            await router.replace({
              name: "DjPanel",
              params: { roomId: sessionStore.roomId },
            });
          } else if (roundStatus === "voting") {
            await router.replace({
              name: "PlaySong",
              params: { roomId: sessionStore.roomId },
            });
          }
        }
        break;
      case "summary":
        await router.replace({
          name: "Summary",
          params: { roomId: sessionStore.roomId },
        });
        break;
      case "finished":
        sessionStore.clearRoomId();
        await router.replace({ name: "HomeView" });
        break;
      default:
        await router.replace({ name: "HomeView" });
    }
  };

  return {
    fetchRoundStatus,
    fetchDjId,
    redirectToCurrentGameState,
  };
}
