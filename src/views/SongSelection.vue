<template>
  <div class="song-selection">
    <section>
      <h1>Wybieranie utworu</h1>

      <SongSearch />

      <!-- FORMULARZ WYBORU PIOSENKI
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
     -->
      <!-- OBSZAR INFORMUJĄCY, ŻE WSZYSCY GRACZE ZŁOŻYLI PIOSENKI -->
      <Transition name="fade" appear>
        <div v-if="allPlayersSubmitted && isDj">
          <p style="color: white; margin-top: 1rem">
            Każdy wybrał już swój utwór, możesz teraz rozpocząć grę!
          </p>
          <button v-if="isDj" @click="handleStartGame" class="btn-start">
            Start
          </button>
        </div>
      </Transition>

      <!-- STATUSY GRACZY ICH GOTOWOŚCI (Submitted / Not Submitted) -->
      <div class="players-grid">
        <ul
          v-if="players && Object.keys(players).length > 0"
          class="player-list"
        >
          <li v-for="(player, id) in players" :key="id" class="player-item">
            <div class="player-name">
              {{ player.name }}
            </div>
            <div class="player-status">
              <font-awesome-icon
                :icon="['fas', 'check']"
                v-if="playerSongs[id]"
                class="submitted-icon"
                title="Submitted"
              />

              <font-awesome-icon
                v-else
                :icon="['fas', 'xmark']"
                class="not-submitted-icon"
                title="Not submitted"
              />
            </div>
          </li>
        </ul>
        <p v-else>Loading player statuses...</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter } from "vue-router";
import { useSessionStore } from "@/stores/session";
import { getDatabase, ref as dbRef, onValue, off } from "firebase/database";
import { updatePlayerSong } from "@/services/songService";
import Status from "./Status.vue";
import DjPanel from "@/views/DjPanel.vue";
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
      if (!router.hasRoute("DjPanel")) {
        router.addRoute({
          path: `/dj-panel/${roomId}`,
          name: "DjPanel",
          component: DjPanel,
        });
      }

      router.push(`/dj-panel/${roomId}`); // Przekierowanie użytkownika po dodaniu trasy
      // router.push({ name: "DjPanel", params: { roomId } });
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
  padding: 2rem;
  margin: 2rem;
}

form {
}

form div {
  margin-bottom: 20px;
}

input {
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
.btn-start {
  color: #fff;
  background: linear-gradient(145deg, #ffcc00, #ff9900);
  border-color: #ff6600;
  box-shadow: 0 0.375rem 0 #cc5200, 0 0.625rem 1.25rem rgba(0, 0, 0, 0.3);
  text-shadow: 2px 2px 0 #cc5200;
}

.btn-start:hover {
  background: linear-gradient(145deg, #ffdd33, #ffbb00);
  box-shadow: 0 0.25rem 0 #cc5200, 0 0.375rem 0.9375rem rgba(0, 0, 0, 0.5);
}
.submitted {
  color: green;
  font-weight: bold;
}
ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
  text-align: left;
}

.players-grid {
}

/* The flexbox container */
.player-list {
}

/* Individual player items */
.player-list > * {
  flex: 1 1 100px; /* 3 items per row with gap spacing */
  min-width: min-content;
  max-width: 100%; /* Prevent items from growing beyond their container */
  box-sizing: border-box;
}

.player-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #bcbfc2;
  font-weight: normal;
  padding: 0.5rem 1rem;
  gap: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Player info styles */
.player-name {
  font-weight: bold;
  font-size: 1rem;
}

.player-status {
  font-size: 1.25rem; /* icon size */
}

/* Icons for submitted / not submitted */
.submitted-icon {
  color: #00ff99; /* green-ish */
}

.not-submitted-icon {
  color: #ff5555; /* red-ish */
}
</style>
