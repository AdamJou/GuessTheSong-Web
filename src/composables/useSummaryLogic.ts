import { ref, computed } from "vue";
import { getDatabase, ref as dbRef, get, update } from "firebase/database";
import type { Room, Game } from "@/types/types";
import { useSessionStore } from "@/stores/session";
import { useRouter } from "vue-router";

/**
 * Ten composable trzyma *całą logikę*:
 * - Pobranie rooms/{roomId} (raz),
 * - Ustalenie justFinishedGame, isLastGame, displayedGameId,
 * - Tworzenie listy allGameIds,
 * - Przekierowania do SongSelection,
 * - SetSongSelection, goHome, itp.
 * - Dodatkowo: getPlayerNickname (przekształcenie playerId -> nickname)
 */
export function useSummaryLogic() {
  const sessionStore = useSessionStore();
  const router = useRouter();

  // computed do store
  const roomId = computed(() => sessionStore.roomId);
  const playerId = computed(() => sessionStore.playerId);
  const players = computed(() => sessionStore.players);
  const isDj = computed(() => sessionStore.playerId === sessionStore.djId);
  const isRoomFinished = computed(() => sessionStore.gameStatus === "finished");

  // Stan: wczytane dane pokoju
  const roomData = ref<Room | null>(null);

  // Czy to ostatnia gra?
  const isLastGame = ref(false);

  // Aktualnie wybrana gra do wyświetlenia w summary
  const displayedGameId = ref("");

  // Lista wszystkich gier (np. ["game1","game2"]).
  const allGameIds = ref<string[]>([]);

  /**
   * Tylko do odczytu "gameData" - obiekt bieżącej gry
   * z roomData.games[displayedGameId]
   */
  const displayedGameData = computed<Game | null>(() => {
    if (!roomData.value) return null;
    if (!displayedGameId.value) return null;
    return roomData.value.games?.[displayedGameId.value] || null;
  });

  /**
   * Główna funkcja do wczytania "rooms/{roomId}" (raz),
   * ustalenia justFinishedGame => displayedGameId,
   * sprawdzenia, czy to ostatnia gra => isLastGame,
   * generowania allGameIds, itp.
   */
  async function initSummary() {
    if (!roomId.value) return;
    const db = getDatabase();
    const snapshot = await get(dbRef(db, `rooms/${roomId.value}`));
    if (!snapshot.exists()) {
      console.error("Nie odnaleziono pokoju w bazie");
      return;
    }
    const rd = snapshot.val() as Room;
    roomData.value = rd;

    const justFinished = rd.justFinishedGame || "";
    if (!justFinished) {
      console.warn("Brak justFinishedGame - nie wiadomo, co podsumować");
      return;
    }

    // Wyciągamy numer, np. z "game1" -> 1
    const justFinishedNum = parseInt(justFinished.replace("game", ""), 10);
    // Liczba graczy = max liczba gier
    const playerCount = Object.keys(rd.players || {}).length;

    // Ostatnia gra, jeśli justFinishedNum === playerCount
    isLastGame.value = justFinishedNum === playerCount;

    // Domyślnie pokazujemy grę, która właśnie się skończyła
    displayedGameId.value = justFinished;

    // Jeśli ostatnia gra, tworzymy listę ["game1","game2",...]
    if (isLastGame.value && rd.games) {
      const ids = Object.keys(rd.games);
      ids.sort((a, b) => {
        const na = parseInt(a.replace("game", ""), 10);
        const nb = parseInt(b.replace("game", ""), 10);
        return na - nb;
      });
      allGameIds.value = ids;
    } else {
      allGameIds.value = [];
    }
  }

  /**
   * Przełączamy widok z "gameX" na "gameY"
   */
  function setDisplayedGame(gid: string) {
    displayedGameId.value = gid;
  }

  /**
   * Zmiana statusu pokoju na "song_selection" (tylko DJ)
   */
  async function setSongSelection() {
    if (!roomId.value) return;
    try {
      const db = getDatabase();
      await update(dbRef(db, `rooms/${roomId.value}`), {
        status: "song_selection",
      });
      console.log("Status pokoju -> 'song_selection'");
    } catch (error) {
      console.error("Błąd setSongSelection:", error);
    }
  }

  /**
   * Reakcja na store.gameStatus = "song_selection" -> router push
   */
  function handleGameStatusChange(newStatus: string | null) {
    if (newStatus === "song_selection") {
      router.push({
        name: "SongSelection",
        params: { roomId: roomId.value },
      });
    }
  }

  /**
   * Powrót do home - czyścimy players/{playerId}/currentGame, roomId w store
   */
  async function goHome() {
    if (playerId.value) {
      const db = getDatabase();
      await update(dbRef(db, `players/${playerId.value}`), {
        currentGame: "",
      });
    }
    sessionStore.clearRoomId();
    router.push("/");
  }

  /**
   * Funkcja zwracająca nickname gracza (playerId -> nickname).
   * Używa "roomData.value?.players", jeśli dostępne.
   */
  function getPlayerNickname(pId: string): string {
    const playersObj = players.value || {};
    return playersObj[pId].name;
  }

  /**
   * Przykład użycia getPlayerNickname w composable:
   * Możesz go potem wywołać w widoku, np. console.log sampleUsage()
   * lub w innej logice.
   */
  function sampleUsage() {
    if (!displayedGameData.value) return;
    // Załóżmy, że w displayedGameData mamy "rounds.round1.song.suggestedBy"
    const firstRoundKey = Object.keys(displayedGameData.value.rounds || {})[0];
    if (!firstRoundKey) return;

    const roundData = displayedGameData.value.rounds[firstRoundKey];
    const suggestedById = roundData.song.suggestedBy;
    const nick = getPlayerNickname(suggestedById);
    console.log("Pierwsza runda zaproponowana przez:", nick);
  }

  return {
    // Wartości reaktywne
    roomId,
    isDj,
    isRoomFinished,
    roomData,
    isLastGame,
    displayedGameId,
    allGameIds,
    displayedGameData,

    // Metody
    initSummary,
    setDisplayedGame,
    setSongSelection,
    handleGameStatusChange,
    goHome,

    getPlayerNickname,
    sampleUsage,
  };
}
