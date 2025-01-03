<template>
  <div class="song-selection">
    <h1>Song Selection</h1>
    <p>
      Your Room Code: <strong>{{ roomId }}</strong>
    </p>
    <SongSearch />

    <!-- FORMULARZ WYBORU PIOSENKI -->
    <form @submit.prevent="submitSong" v-if="!hasSubmitted">
      <div>
        <label for="songId">Song ID:</label>
        <input
          v-model="songId"
          type="text"
          id="songId"
          placeholder="Enter Song ID"
          required
        />
      </div>
      <div>
        <label for="songTitle">Song Title:</label>
        <input
          v-model="songTitle"
          type="text"
          id="songTitle"
          placeholder="Enter Song Title"
          required
        />
      </div>
      <button type="submit" :disabled="!canSubmit">Submit</button>
    </form>
    <!-- OBSZAR INFORMUJĄCY, ŻE WSZYSCY GRACZE ZŁOŻYLI PIOSENKI -->
    <div v-if="allPlayersSubmitted">
      <p>
        Everyone has submitted their songs! Waiting for the game to start...
      </p>
      <button v-if="isDj" @click="handleStartGame">Start Game</button>
    </div>

    <!-- STATUSY GRACZY ICH GOTOWOŚCI (Submitted / Not Submitted) -->
    <div>
      <h2>Player Status:</h2>
      <ul v-if="players && Object.keys(players).length > 0">
        <li v-for="(player, id) in players" :key="id">
          {{ player.name }} -
          <span :class="{ submitted: !!playerSongs[id] }">
            {{ playerSongs[id] ? "Submitted" : "Not Submitted" }}
          </span>
        </li>
      </ul>
      <p v-else>Loading player statuses...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter } from "vue-router";
import { useSessionStore } from "@/stores/session";
import { getDatabase, ref as dbRef, onValue, off } from "firebase/database";
import { updatePlayerSong } from "@/services/songService";
import Status from "./Status.vue";
import SongSearch from "@/components/SongSearch.vue";
// Inicjalizacja routera i store'ów
const router = useRouter();
const sessionStore = useSessionStore();

// Dane z sessionStore
const roomId = sessionStore.roomId as string;
const playerId = sessionStore.playerId as string;
const currentGame = computed(() => sessionStore.currentGame);
const players = computed(() => sessionStore.players);
const isDj = computed(() => sessionStore.djId === playerId);
const gameStatus = computed(() => sessionStore.gameStatus);
console.log("isDj", isDj.value);

// Lokalne dane formularza
const songId = ref("");
const songTitle = ref("");
const playerSongs = ref<Record<string, string>>({});

// Obliczenia bazujące na `playerSongs`
const hasSubmitted = computed(() => !!playerSongs.value[playerId]);
const allPlayersSubmitted = computed(() => {
  const totalPlayers = Object.keys(players.value || {});
  return totalPlayers.every((id) => !!playerSongs.value[id]);
});

// Walidacja formularza
const canSubmit = computed(() => songId.value.trim() && songTitle.value);

// Funkcja przesyłania piosenki
const submitSong = async () => {
  if (canSubmit.value) {
    await updatePlayerSong(
      roomId,
      currentGame.value!,
      playerId,
      songId.value,
      songTitle.value
    );
  }
};

// Subskrypcja do zmian w playerSongs
let unsubscribe: (() => void) | null = null;

const subscribeToPlayerSongs = () => {
  const db = getDatabase();
  const path = `rooms/${roomId}/games/${currentGame.value}/playerSongs`;
  const songsRef = dbRef(db, path);

  unsubscribe = onValue(songsRef, (snapshot) => {
    playerSongs.value = snapshot.exists() ? snapshot.val() : {};
  });
};

const unsubscribeFromPlayerSongs = () => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
};

// Subskrypcje na `currentGame`
watch(
  currentGame,
  (newGame) => {
    unsubscribeFromPlayerSongs();
    if (newGame) {
      subscribeToPlayerSongs();
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  unsubscribeFromPlayerSongs();
});

const handleStartGame = async () => {
  try {
    await sessionStore.setGameStatus("voting");
    handleGameStatusChange("voting");
  } catch (error) {
    console.error("Error starting the game:", error);
    alert("An error occurred while starting the game. Please try again.");
  }
};

// Funkcja reagująca na zmianę statusu gry
const handleGameStatusChange = (status: string | null) => {
  if (!status) return;

  if (status === "voting") {
    if (isDj.value) {
      router.push({ name: "DjPanel", params: { roomId } });
    } else {
      router.push({ name: "Voting", params: { roomId } });
    }
  }
};
// Obserwacja `gameStatus` i reagowanie na jego zmiany
watch(gameStatus, (newStatus) => {
  handleGameStatusChange(newStatus);
});

watch(
  currentGame,
  (newGameId) => {
    if (newGameId) {
      unsubscribeFromPlayerSongs();
      subscribeToPlayerSongs();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.song-selection {
  text-align: center;
  margin-top: 50px;
}

form {
  display: flex;
  flex-direction: column;
  align-items: center;
}

form div {
  margin-bottom: 20px;
}

input {
  padding: 10px;
  font-size: 16px;
  width: 300px;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}

.submitted {
  color: green;
  font-weight: bold;
}
</style>
