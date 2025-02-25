import { ref, watch, computed } from "vue";
import { getDatabase, ref as dbRef, onValue, off } from "firebase/database";
import { useSessionStore } from "@/stores/session";
import { Players } from "@/types/types";

export function useVotes() {
  const sessionStore = useSessionStore();

  const roomId = computed(() => sessionStore.roomId);
  const currentGame = computed(() => sessionStore.currentGame);
  const currentRound = computed(() => sessionStore.currentRound);
  const players = computed<Players>(() => sessionStore.players);
  const playerId = computed(() => sessionStore.playerId);

  const votes = ref<Record<string, string>>({});
  const hasVoted = ref(false);
  const votedPlayer = ref<string | null>(null);

  let unsubscribeVotes: (() => void) | null = null;

  const subscribeToVotes = () => {
    if (!roomId.value || !currentGame.value || !currentRound.value) return;

    const db = getDatabase();
    const votesRef = dbRef(
      db,
      `rooms/${roomId.value}/games/${currentGame.value}/rounds/${currentRound.value}/votes`
    );

    unsubscribeFromVotes();

    unsubscribeVotes = onValue(votesRef, (snapshot) => {
      const voteData = snapshot.val();

      votes.value = voteData && typeof voteData === "object" ? voteData : {};

      if (playerId.value && votes.value[playerId.value]) {
        hasVoted.value = true;
        votedPlayer.value =
          players.value?.[votes.value[playerId.value]]?.name || "Unknown";
      } else {
        hasVoted.value = false;
        votedPlayer.value = null;
      }
    });
  };

  const unsubscribeFromVotes = () => {
    if (unsubscribeVotes) {
      unsubscribeVotes();
      unsubscribeVotes = null;
    }
  };

  watch(
    [currentGame, currentRound],
    () => {
      subscribeToVotes();
    },
    { immediate: true }
  );

  const resetVotes = () => {
    hasVoted.value = false;
    votedPlayer.value = null;
    votes.value = {};
  };

  const getPlayerName = (id: string): string =>
    players.value?.[id]?.name || "Unknown";

  return {
    votes,
    hasVoted,
    votedPlayer,
    getPlayerName,
    resetVotes,
    unsubscribeFromVotes,
  };
}
