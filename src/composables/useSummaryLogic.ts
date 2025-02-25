import { ref, computed } from "vue";
import { getDatabase, ref as dbRef, get, update } from "firebase/database";
import type { Room, Game } from "@/types/types";
import { useSessionStore } from "@/stores/session";
import { useRouter } from "vue-router";

export function useSummaryLogic() {
  const sessionStore = useSessionStore();
  const router = useRouter();

  const roomId = computed(() => sessionStore.roomId);
  const playerId = computed(() => sessionStore.playerId);
  const players = computed(() => sessionStore.players);
  const isDj = computed(() => sessionStore.playerId === sessionStore.djId);
  const isRoomFinished = computed(() => sessionStore.gameStatus === "finished");

  const roomData = ref<Room | null>(null);

  const isLastGame = ref(false);

  const displayedGameId = ref("");

  const allGameIds = ref<string[]>([]);

  const displayedGameData = computed<Game | null>(() => {
    if (!roomData.value) return null;
    if (!displayedGameId.value) return null;
    return roomData.value.games?.[displayedGameId.value] || null;
  });

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

    const justFinishedNum = parseInt(justFinished.replace("game", ""), 10);
    const playerCount = Object.keys(rd.players || {}).length;

    isLastGame.value = justFinishedNum === playerCount;

    displayedGameId.value = justFinished;

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

  function setDisplayedGame(gid: string) {
    displayedGameId.value = gid;
  }

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

  function handleGameStatusChange(newStatus: string | null) {
    if (newStatus === "song_selection") {
      router.replace({
        name: "SongSelection",
        params: { roomId: roomId.value },
      });
    }
  }

  async function goHome() {
    if (playerId.value) {
      const db = getDatabase();
      await update(dbRef(db, `players/${playerId.value}`), {
        currentGame: "",
      });
    }
    sessionStore.clearRoomId();
    router.replace("/");
  }

  function getPlayerNickname(pId: string): string {
    const playersObj = players.value || {};
    return playersObj[pId].name;
  }

  function sampleUsage() {
    if (!displayedGameData.value) return;
    const firstRoundKey = Object.keys(displayedGameData.value.rounds || {})[0];
    if (!firstRoundKey) return;

    const roundData = displayedGameData.value.rounds[firstRoundKey];
    const suggestedById = roundData.song.suggestedBy;
    const nick = getPlayerNickname(suggestedById);
  }

  return {
    roomId,
    isDj,
    isRoomFinished,
    roomData,
    isLastGame,
    displayedGameId,
    allGameIds,
    displayedGameData,

    initSummary,
    setDisplayedGame,
    setSongSelection,
    handleGameStatusChange,
    goHome,

    getPlayerNickname,
    sampleUsage,
  };
}
