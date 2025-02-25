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
      <button
        @click="submitVote"
        :disabled="!selectedPlayer"
        :class="{ disabled: !selectedPlayer }"
        class="btn-submit"
      >
        Zagłosuj
      </button>
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
  max-width: 100vw;
}
h1 {
  margin-bottom: 0;
}
ul {
  list-style-type: none;
  padding: 0 1rem;
}

li {
  margin: 10px 0;
  cursor: pointer;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

li.selected {
  background-color: #007bff;
  color: white;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 5px;
  margin: 2rem 0;
}
.song-container {
  padding: 1rem;
}
button:disabled {
  background-color: #ccc;
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
}
.voted-on {
  color: #ffcc00;
  font-size: larger;
}

.btn-submit {
  color: #fff;
  background: linear-gradient(145deg, #ffcc00, #ff9900);
  border-color: #ff6600;
  box-shadow: 0 0.375rem 0 #cc5200, 0 0.625rem 1.25rem rgba(0, 0, 0, 0.3);
  text-shadow: 2px 2px 0 #cc5200;
}

.btn-submit:hover {
  background: linear-gradient(145deg, #ffdd33, #ffbb00);
  box-shadow: 0 0.25rem 0 #cc5200, 0 0.375rem 0.9375rem rgba(0, 0, 0, 0.5);
}

.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
