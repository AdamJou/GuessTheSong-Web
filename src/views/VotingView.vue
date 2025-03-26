<template>
  <div class="voting-view">
    <h1>RUNDA {{ currentRound?.replace(/\D/g, "") }}</h1>
    <p v-if="!currentSong?.songId" class="blink">DJ wybiera utwór...</p>

    <div v-if="currentSong" class="song-container">
      <transition name="fade">
        <div v-if="currentSong?.songId">
          <p>
            Tytuł: <strong>{{ currentSong.songTitle }}</strong>
          </p>
        </div>
      </transition>
      <YouTubePlayer
        v-if="currentSong?.songId && gameMode === 'separate'"
        :songId="currentSong.songId"
      />
    </div>

    <div v-if="currentSong && currentSong.songId && !hasVoted">
      <h3>Zagłosuj na gracza</h3>
      <div class="players-container">
        <ul>
          <li
            v-for="(player, playerId) in otherPlayers"
            :key="playerId"
            @click="selectPlayer(playerId)"
            :class="{ selected: selectedPlayer === playerId }"
          >
            {{ player.name }}
          </li>
        </ul>
      </div>
      <div class="vote-button-container">
        <button
          @click="submitVote"
          :disabled="!selectedPlayer"
          :class="{ disabled: !selectedPlayer }"
          class="btn-submit"
        >
          Zagłosuj
        </button>
      </div>
    </div>

    <div v-if="hasVoted">
      <p>
        Zagłosowałeś na <strong class="voted-on">{{ votedPlayer }}</strong>
      </p>
    </div>

    <VotingStatus v-if="hasVoted" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from "vue";
import YouTubePlayer from "@/components/YouTubePlayer.vue";
import VotingStatus from "@/components/VotingStatus.vue";
import { getDatabase, ref as dbRef, onValue, update } from "firebase/database";
import { useSessionStore } from "@/stores/session";
import { useRouter } from "vue-router";
import { useVotes } from "@/composables/useVotes";

const router = useRouter();
const sessionStore = useSessionStore();

const roomId = computed(() => sessionStore.roomId);
const currentGame = computed(() => sessionStore.currentGame);
const currentRound = computed(() => sessionStore.currentRound);
const players = computed(() => sessionStore.players);
const playerId = computed(() => sessionStore.playerId);
const isDJ = computed(() => sessionStore.djId === playerId.value);

const currentSong = ref<{ songId: string; songTitle: string } | null>(null);

const selectedPlayer = ref<string | null>(null);

const roomStatus = ref<string | null>(null);

const { votes, hasVoted, votedPlayer, getPlayerName, resetVotes } = useVotes();

const otherPlayers = computed(() =>
  Object.keys(players.value || {}).reduce((filtered, id) => {
    if (id !== playerId.value) {
      filtered[id] = players.value[id];
    }
    return filtered;
  }, {} as Record<string, { name: string }>)
);

const db = getDatabase();

let songUnsubscribe: (() => void) | null = null;
let roomStatusUnsubscribe: (() => void) | null = null;
let gameModeUnsubscribe: (() => void) | null = null;

const subscribeToRoomStatus = () => {
  if (!roomId.value) return;
  const roomStatusRef = dbRef(db, `rooms/${roomId.value}/status`);
  roomStatusUnsubscribe = onValue(roomStatusRef, (snapshot) => {
    roomStatus.value = snapshot.val();
    if (roomStatus.value === "summary" || roomStatus.value === "finished") {
      router.replace({ name: "Summary", params: { roomId: roomId.value } });
    }
  });
};

const subscribeToSong = () => {
  if (!roomId.value || !currentGame.value || !currentRound.value) return;
  const songRef = dbRef(
    db,
    `rooms/${roomId.value}/games/${currentGame.value}/rounds/${currentRound.value}/song`
  );
  songUnsubscribe = onValue(songRef, (snapshot) => {
    currentSong.value = snapshot.exists() ? snapshot.val() : null;
    console.log("Current Song:", currentSong.value);
  });
};

const subscribeToGameMode = () => {
  if (!roomId.value) return;
  const gameModeRef = dbRef(db, `rooms/${roomId.value}/gameMode`);
  gameModeUnsubscribe = onValue(gameModeRef, (snapshot) => {
    gameMode.value = snapshot.val();
  });
};

const gameMode = ref<string | null>(null);

subscribeToRoomStatus();
subscribeToSong();
subscribeToGameMode();

watch(
  currentRound,
  () => {
    if (songUnsubscribe) songUnsubscribe();
    subscribeToSong();
    resetVotes();
    selectedPlayer.value = null;
  },
  { immediate: true }
);

const selectPlayer = (id: string) => {
  selectedPlayer.value = id;
};

import { runTransaction } from "firebase/database";

const submitVote = async () => {
  if (
    !roomId.value ||
    !currentGame.value ||
    !currentRound.value ||
    !playerId.value ||
    !selectedPlayer.value
  ) {
    alert("Unable to submit your vote. Please try again.");
    return;
  }

  const voteRef = dbRef(
    db,
    `rooms/${roomId.value}/games/${currentGame.value}/rounds/${currentRound.value}/votes/${playerId.value}`
  );

  await runTransaction(voteRef, (currentData) => {
    if (currentData === null || currentData === "") {
      return selectedPlayer.value;
    }
    // Jeśli głos już istnieje, transakcja zostanie przerwana
    return; // zwracając undefined, abortujemy transakcję
  }).then((result) => {
    if (!result.committed) {
      alert("Głos już został oddany i nie można go zmienić!");
    }
  });
};

onBeforeUnmount(() => {
  if (songUnsubscribe) {
    songUnsubscribe();
    songUnsubscribe = null;
  }
  if (roomStatusUnsubscribe) {
    roomStatusUnsubscribe();
    roomStatusUnsubscribe = null;
  }
  if (gameModeUnsubscribe) {
    gameModeUnsubscribe();
    gameModeUnsubscribe = null;
  }
});
</script>

<style scoped>
.voting-view {
  text-align: center;
  color: white;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  align-items: center;
  padding: 1rem;
}

h1 {
  margin: 0 0 1rem 0;
  width: 100%;
}

h3 {
  margin: 0.5rem 0;
  color: #ffcc00;
  width: 100%;
}

.song-container {
  width: 100%;
  max-width: 600px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.song-container p {
  margin: 0;
  width: 100%;
}

.players-container {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 0;
  margin-bottom: 80px; /* Space for the button */
}

ul {
  list-style-type: none;
  padding: 0.5rem;
  margin: 0;
  overflow-y: auto;
  max-height: calc(100vh - 300px);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 153, 0, 0.3) transparent;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
}

li {
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  box-sizing: border-box;
  text-align: left;
}

li:hover {
  background: rgba(255, 153, 0, 0.2);
  border-color: rgba(255, 153, 0, 0.3);
  transform: translateY(-1px);
}

li.selected {
  background: rgba(255, 153, 0, 0.3);
  border-color: #ff9900;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 153, 0, 0.2);
}

.vote-button-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background: rgba(13, 13, 58, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10;
  display: flex;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .vote-button-container {
    padding: 1rem calc((100% - 600px) / 2);
  }

  .btn-submit {
    max-width: 600px;
    width: 100%;
  }

  .players-container {
    padding: 0;
  }
}

.btn-submit {
  width: 100%;
  padding: 0.875rem 1.875rem;
  font-size: 1.125rem;
  color: #fff;
  background: linear-gradient(145deg, #ffcc00, #ff9900);
  border: none;
  border-radius: 0.9375rem;
  box-shadow: 0 0.375rem 0 #cc5200, 0 0.625rem 1.25rem rgba(0, 0, 0, 0.3);
  text-shadow: 2px 2px 0 #cc5200;
  cursor: pointer;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.btn-submit:hover:not(.disabled) {
  background: linear-gradient(145deg, #ffdd33, #ffbb00);
  box-shadow: 0 0.25rem 0 #cc5200, 0 0.375rem 0.9375rem rgba(0, 0, 0, 0.5);
  transform: translateY(-1px);
}

.btn-submit:active:not(.disabled) {
  transform: translateY(1px);
  box-shadow: 0 0.25rem 0 #cc5200, 0 0.25rem 0.5rem rgba(0, 0, 0, 0.3);
}

.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

@keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    opacity: 1;
  }
}

.blink {
  animation: blink 1.5s infinite ease-in-out;
}

.fade-enter-active {
  animation: fadeIn 0.8s ease-in-out;
}
.fade-leave-active {
  animation: fadeOut 0.5s ease-in-out;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeOut {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-20px);
  }
}

strong {
  color: #ff9900;
  font-size: larger;
  display: block;
  margin-top: 0.5rem;
}

.voted-on {
  color: #ffcc00;
  font-size: larger;
}
</style>
