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

    unsubscribeVotes = onValue(votesRef, (snapshot) => {
      const voteData = snapshot.val() || {};
      votes.value = voteData;

      // Check if the current player has already voted
      if (playerId.value && voteData[playerId.value]) {
        hasVoted.value = true;
        votedPlayer.value =
          players.value?.[voteData[playerId.value]]?.name || "Unknown";
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
      unsubscribeFromVotes();
      subscribeToVotes();
    },
    { immediate: true }
  );

  const resetVotes = () => {
    hasVoted.value = false;
    votedPlayer.value = null;
  };

  return {
    votes,
    hasVoted,
    votedPlayer,
    getPlayerName: (id: string) => players.value?.[id]?.name || "Unknown",
    resetVotes,
  };
}
