<template>
  <div class="play-song-view" v-if="roomId">
    <h2>Obecnie odtwarzamy</h2>

    <div v-if="currentSong" class="song-container">
      <strong>{{ currentSong.songTitle }}</strong>
      <YouTubePlayer v-if="currentSong.songId" :songId="currentSong.songId" />
    </div>
    <Transition name="cartoon-modal" appear>
      <div v-if="allPlayersHaveVoted">
        <button @click="goBackToSongSelection" class="btn-submit">
          Wybierz następny utwór
        </button>
      </div>
    </Transition>
    <VotingStatus />
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  getDatabase,
  ref as dbRef,
  onValue,
  update,
  get,
} from "firebase/database";
import { useSessionStore } from "@/stores/session";
import { useVotes } from "@/composables/useVotes";
import { useRouter } from "vue-router";
import { useScoreCalculator } from "@/composables/useScoreCalculator";
import YouTubePlayer from "@/components/YouTubePlayer.vue";
import VotingStatus from "@/components/VotingStatus.vue";
import { useLoadingStore } from "@/stores/useLoadingStore";
import { useGameProgression } from "@/composables/useGameProgression";
const { calculateAndSaveScores } = useScoreCalculator();

const sessionStore = useSessionStore();
const loadingStore = useLoadingStore();
const router = useRouter();
const { handleNextRound, handleNextGame } = useGameProgression();

const roomId = computed(() => sessionStore.roomId);
const currentGame = computed(() => sessionStore.currentGame);
const currentRound = computed(() => sessionStore.currentRound);
const players = computed(() => sessionStore.players);
const djId = computed(() => sessionStore.djId);
const playerId = computed(() => sessionStore.playerId);
const currentSong = ref<{ songId: string; songTitle: string } | null>(null);

const { votes, getPlayerName } = useVotes();

const hasValidVotes = computed(() => {
  return (
    Object.values(votes.value).some((votedForId) => {
      return getPlayerName(votedForId) === "Unknown";
    }) === false
  );
});

const allPlayersHaveVoted = computed(() => {
  const totalPlayers = Object.keys(players.value || {}).filter(
    (id) => id !== sessionStore.djId
  );
  return totalPlayers.every((id) => votes.value[id]);
});

let songUnsubscribe: (() => void) | null = null;

const subscribeToSong = () => {
  if (!roomId.value || !currentGame.value || !currentRound.value) return;

  const db = getDatabase();
  const songRef = dbRef(
    db,
    `rooms/${roomId.value}/games/${currentGame.value}/rounds/${currentRound.value}/song`
  );

  songUnsubscribe = onValue(songRef, (snapshot) => {
    currentSong.value = snapshot.exists() ? snapshot.val() : null;
  });
};

const unsubscribeFromSong = () => {
  if (songUnsubscribe) {
    songUnsubscribe();
    songUnsubscribe = null;
  }
};

watch(
  [currentGame, currentRound],
  () => {
    unsubscribeFromSong();
    subscribeToSong();
  },
  { immediate: true }
);

const goBackToSongSelection = async () => {
  loadingStore.startLoading();
  await new Promise((r) => setTimeout(r, 2000));

  try {
    const currentRoundNumber = parseInt(
      currentRound.value!.replace("round", "")
    );
    const playerCount = Object.values(players.value || {}).length;

    // Check if we need to move to next game
    if (currentRoundNumber >= playerCount) {
      await handleNextGame(
        roomId.value!,
        currentGame.value!,
        currentRound.value!,
        players.value
      );
      return;
    }

    // Handle next round within the same game
    await handleNextRound(
      roomId.value!,
      currentGame.value!,
      currentRound.value!,
      players.value,
      djId.value!
    );

    router.replace({ name: "DjPanel", params: { roomId: roomId.value } });
  } catch (error) {
    console.error(
      "Error updating round status and creating the next round:",
      error
    );
    alert("Failed to go back to song selection. Please try again.");
  } finally {
    loadingStore.stopLoading();
  }
};
</script>

<style scoped>
.play-song-view {
  text-align: center;
  color: white;
  max-width: 100vw;
  overflow-x: hidden;
}

h1 {
  font-size: 2rem;
  margin-bottom: 20px;
}

p {
  font-size: 1.2rem;
  margin: 0;
}
.song-container {
  padding: 1rem;
}
h2 {
  margin-top: 20px;
  font-size: 1.5rem;
}
strong {
  color: #ff9900;
  font-size: larger;
}
button {
  padding: 0.875rem 1.875rem; /* 14px 30px */
  font-size: 1.125rem; /* 18px */
  text-transform: uppercase;
  border-radius: 0.9375rem; /* 15px */
  border: 0.25rem solid; /* 4px */
  transition: all 0.3s ease-in-out;
  letter-spacing: 2px;
  position: relative;
  cursor: pointer;
  margin-top: 1rem;
}
.btn-submit {
  color: #fff;
  background: linear-gradient(145deg, #ffcc00, #ff9900);
  border-color: #ff6600;
  box-shadow: 0 0.375rem 0 #cc5200, 0 0.625rem 1.25rem rgba(0, 0, 0, 0.3);
  text-shadow: 2px 2px 0 #cc5200;
  margin-bottom: 1.5rem;
}

.btn-submit:hover {
  background: linear-gradient(145deg, #ffdd33, #ffbb00);
  box-shadow: 0 0.25rem 0 #cc5200, 0 0.375rem 0.9375rem rgba(0, 0, 0, 0.5);
}
</style>
