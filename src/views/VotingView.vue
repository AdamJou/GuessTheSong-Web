<template>
  <div class="voting-view">
    <h1>{{ currentRound }}</h1>
    <!-- Display message while waiting for DJ -->
    <p v-if="!currentSong?.songId" class="blink">DJ wybiera utwór...</p>

    <!-- Display song details once available -->
    <transition name="fade">
      <div v-if="currentSong?.songId">
        <p>
          Tytuł: <strong>{{ currentSong.songTitle }}</strong>
        </p>
      </div>
    </transition>
    <!-- Voting Section -->
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
        Submit Vote
      </button>
    </div>

    <!-- After Voting -->
    <div v-if="hasVoted">
      <p>
        Zagłosowałeś na <strong class="voted-on">{{ votedPlayer }}</strong>
      </p>
    </div>

    <!-- Display Real-Time Votes -->
    <VotingStatus v-if="hasVoted" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from "vue";
import VotingStatus from "@/components/VotingStatus.vue";
import { getDatabase, ref as dbRef, onValue, update } from "firebase/database";
import { useSessionStore } from "@/stores/session";
import { useRouter } from "vue-router";
import { useVotes } from "@/composables/useVotes";

// Router and Session Store
const router = useRouter();
const sessionStore = useSessionStore();

// Reactive Data
const roomId = computed(() => sessionStore.roomId);
const currentGame = computed(() => sessionStore.currentGame);
const currentRound = computed(() => sessionStore.currentRound);
const players = computed(() => sessionStore.players);
const playerId = computed(() => sessionStore.playerId);
const isDJ = computed(() => sessionStore.djId === playerId.value);
const currentSong = ref<{ songId: string; songTitle: string } | null>(null);
const selectedPlayer = ref<string | null>(null);
const roomStatus = ref<string | null>(null);

// Use the reusable useVotes composable
const { votes, hasVoted, votedPlayer, getPlayerName, resetVotes } = useVotes();

// Other players excluding the current player
const otherPlayers = computed(() =>
  Object.keys(players.value || {}).reduce((filtered, id) => {
    if (id !== playerId.value) {
      filtered[id] = players.value[id];
    }
    return filtered;
  }, {} as Record<string, { name: string }>)
);

// Firebase Subscription Management for Room Status and Song
let songUnsubscribe: (() => void) | null = null;
let roomStatusUnsubscribe: (() => void) | null = null;

// Subscribe to Room Status
const subscribeToRoomStatus = () => {
  if (!roomId.value) return;

  const db = getDatabase();
  const roomStatusRef = dbRef(db, `rooms/${roomId.value}/status`);
  roomStatusUnsubscribe = onValue(roomStatusRef, (snapshot) => {
    roomStatus.value = snapshot.val();
    if (roomStatus.value === "summary" || roomStatus.value === "finished") {
      router.push({ name: "Summary", params: { roomId: roomId.value } });
    }
  });
};

const unsubscribeFromRoomStatus = () => {
  if (roomStatusUnsubscribe) {
    roomStatusUnsubscribe();
    roomStatusUnsubscribe = null;
  }
};

// Subscribe to Current Song
const subscribeToSong = () => {
  if (!roomId.value || !currentGame.value || !currentRound.value) return;

  const db = getDatabase();
  const songRef = dbRef(
    db,
    `rooms/${roomId.value}/games/${currentGame.value}/rounds/${currentRound.value}/song`
  );

  songUnsubscribe = onValue(songRef, (snapshot) => {
    currentSong.value = snapshot.exists() ? snapshot.val() : null;
    console.log("Current Song:", currentSong.value);
  });
};

const unsubscribeFromSong = () => {
  if (songUnsubscribe) {
    songUnsubscribe();
    songUnsubscribe = null;
  }
};

// Reset state when the round changes
watch(
  currentRound,
  () => {
    unsubscribeFromSong();
    subscribeToSong();
    resetVotes(); // Reset voting state when the round changes
    selectedPlayer.value = null; // Clear the selected player
  },
  { immediate: true }
);

// Handle player selection
const selectPlayer = (id: string) => {
  selectedPlayer.value = id;
};

// Submit the vote
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

  const db = getDatabase();
  const votesRef = dbRef(
    db,
    `rooms/${roomId.value}/games/${currentGame.value}/rounds/${currentRound.value}/votes`
  );

  await update(votesRef, {
    [playerId.value]: selectedPlayer.value,
  });

  alert("Vote submitted successfully!");
};

// Initial Setup: Subscribe to Room Status
subscribeToRoomStatus();

onBeforeUnmount(() => {
  unsubscribeFromSong();
  unsubscribeFromRoomStatus();
});
</script>

<style scoped>
.voting-view {
  text-align: center;
  margin-top: 50px;
  color: white;
}

h1 {
  font-size: 2rem;
  margin-bottom: 20px;
}

p {
  font-size: 1.2rem;
}

h2 {
  margin-top: 20px;
  font-size: 1.5rem;
}

ul {
  list-style-type: none;
  padding: 0;
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
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 5px;
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

/* Klasa dla migotania */
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
