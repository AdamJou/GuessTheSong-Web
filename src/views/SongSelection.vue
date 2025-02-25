<template>
  <div class="song-selection">
    <section>
      <h1>Wybieranie utworu</h1>
      <SongSearch />
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
        <p v-else>Ładowanie...</p>
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
const router = useRouter();
const sessionStore = useSessionStore();

const roomId = sessionStore.roomId as string;
const playerId = sessionStore.playerId as string;
const currentGame = computed(() => sessionStore.currentGame);
const players = computed(() => sessionStore.players);
const isDj = computed(() => sessionStore.djId === playerId);
const gameStatus = computed(() => sessionStore.gameStatus);

const songId = ref("");
const songTitle = ref("");
const playerSongs = ref<Record<string, string>>({});

const hasSubmitted = computed(() => !!playerSongs.value[playerId]);
const allPlayersSubmitted = computed(() => {
  const totalPlayers = Object.keys(players.value || {});
  return totalPlayers.every((id) => !!playerSongs.value[id]);
});

const canSubmit = computed(() => songId.value.trim() && songTitle.value);

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
      router.push(`/dj-panel/${roomId}`);
    } else {
      router.push({ name: "Voting", params: { roomId } });
    }
  }
};
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
h1 {
  color: white;
}
.song-selection {
  text-align: center;
  max-width: 100vw;
  overflow-x: hidden;
}

form div {
  margin-bottom: 20px;
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
  font-family: "Bungee", sans-serif;

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
  margin: 1rem;
}
.player-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #bcbfc2;
  font-weight: normal;
  padding: 0.5rem 1rem;
  margin-top: 0.5rem;
  gap: 0.5rem;

  display: flex;
  justify-content: space-between;
  align-items: center;
}

.player-name {
  font-weight: bold;
  font-size: 1rem;
}

.player-status {
  font-size: 1.25rem;
}

.submitted-icon {
  color: #00ff99;
}

.not-submitted-icon {
  color: #ff5555;
}
</style>
