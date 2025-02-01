<template>
  <div class="dj-panel">
    <h1>Panel DJ</h1>

    <h2>Utwory graczy</h2>

    <ul v-if="unplayedSongs.length > 0">
      <li
        v-for="([playerId, song], index) in unplayedSongs"
        :key="index"
        @click="selectSong(playerId, song)"
        class="song-item"
        :class="{ selected: selectedPlayerId === playerId }"
      >
        {{ song.songTitle }}<br />
        <p class="selected-by">
          Wybrany przez:
          <i> {{ getPlayerNickname(playerId) }}</i>
        </p>
      </li>
    </ul>

    <p v-else>No unplayed songs available.</p>
    <Transition name="bounce">
      <div v-if="selectedSong">
        <button @click="submitSelectedSong" class="btn-submit">Wybierz</button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
} from "vue";
import { useSessionStore } from "@/stores/session";
import { getDatabase, ref as dbRef, onValue, update } from "firebase/database";
import { PlayerSong, RoundSong } from "@/types/types";
import { useLoadingStore } from "@/stores/useLoadingStore";
import { useRouter } from "vue-router";
const router = useRouter();
// Session store for current session details
const sessionStore = useSessionStore();
const loadingStore = useLoadingStore();
const roomId = sessionStorage.getItem("roomId") as string;
const currentGame = computed(() => sessionStore.currentGame);
const players = computed(() => sessionStore.players);

const currentRound = computed(() => sessionStore.currentRound);
const allSongsPlayed = ref(false);
// Reactive variable for storing player songs and selected song
const playerSongs = ref<Record<string, PlayerSong>>({});

function getPlayerNickname(pId: string): string {
  const playersObj = players.value || {};
  return playersObj[pId].name;
}

const selectedPlayerId = ref<string | null>(null);
const selectedSong = ref<{
  songId: string;
  songTitle: string;
  suggestedBy: string;
} | null>(null);

// Firebase subscription management
let unsubscribe: (() => void) | null = null;

const unplayedSongs = computed(() =>
  Object.entries(playerSongs.value).filter(([_, song]) => !song.wasPlayed)
);

const subscribeToPlayerSongs = () => {
  const db = getDatabase();
  const gameId = currentGame.value;
  if (!roomId || !gameId) return;

  const songsRef = dbRef(db, `rooms/${roomId}/games/${gameId}/playerSongs`);
  unsubscribe = onValue(songsRef, (snapshot) => {
    if (snapshot.exists()) {
      playerSongs.value = snapshot.val();
    } else {
      playerSongs.value = {};
    }
    allSongsPlayed.value = Object.values(playerSongs.value).every(
      (song) => song.wasPlayed
    );
    console.log(allSongsPlayed.value);
  });
};

const unsubscribeFromPlayerSongs = () => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
};
watch(currentRound, (newRound) => {
  console.log("currentRound updated in DjPanel:", newRound);
});

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

// Selecting a song
const selectSong = (playerId: string, song: PlayerSong) => {
  selectedPlayerId.value = playerId;
  selectedSong.value = {
    songId: song.songId,
    songTitle: song.songTitle,
    suggestedBy: playerId, // Dodaj pole "suggestedBy"
  } as RoundSong;
  console.log("Selected Song:", selectedSong.value);
};

// Submitting the selected song to the current round
const submitSelectedSong = async () => {
  if (
    !roomId ||
    !currentGame.value ||
    !currentRound.value ||
    !selectedSong.value
  ) {
    console.log(
      roomId,
      currentGame.value,
      currentRound.value,
      selectedSong.value
    );
    alert("Missing data to submit the song.");
    return;
  }

  loadingStore.startLoading();
  try {
    const db = getDatabase();
    const roundRef = dbRef(
      db,
      `rooms/${roomId}/games/${currentGame.value}/rounds/${currentRound.value}`
    );

    await update(roundRef, {
      song: selectedSong.value,
      status: "voting", // Update the status to voting
    });

    // Optionally mark the song as played
    const playerSongRef = dbRef(
      db,
      `rooms/${roomId}/games/${currentGame.value}/playerSongs/${selectedPlayerId.value}`
    );

    await update(playerSongRef, { wasPlayed: true });

    router.push({ name: "PlaySong", params: { roomId } });
  } catch (error) {
    console.error("Error submitting song to current round:", error);
    alert("Failed to submit the song. Please try again.");
  } finally {
    loadingStore.stopLoading();
  }
};
</script>

<style scoped>
.dj-panel {
  text-align: center;
  margin-top: 50px;
  color: white;
}

ul {
  list-style-type: none;
  padding: 0 1rem;
  max-height: 50vh;
  overflow: auto;
}

.song-item {
  margin: 10px 0;
  border: 1px solid #ccc;
  padding: 1rem;
  border-radius: 5px;
  cursor: pointer;
}

.song-item.selected {
  background-color: #f0f0f0;
  border-color: #007bff;
  color: #2c3e50;
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
.selected-by,
i {
  font-size: 14px;
  color: #2c3e50;
}
</style>
