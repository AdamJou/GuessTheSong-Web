<template>
  <div class="dj-panel">
    <h1>DJ Panel</h1>
    <p>
      Room ID: <strong>{{ roomId }}</strong>
    </p>
    <h2>Players' Songs</h2>

    <ul v-if="unplayedSongs.length > 0">
      <li
        v-for="([playerId, song], index) in unplayedSongs"
        :key="index"
        @click="selectSong(playerId, song)"
        class="song-item"
        :class="{ selected: selectedPlayerId === playerId }"
      >
        <strong>Player ID:</strong> {{ playerId }}<br />
        <strong>Song ID:</strong> {{ song.songId }}<br />
        <strong>Song Title:</strong> {{ song.songTitle }}<br />
        <strong>Was Played:</strong> {{ song.wasPlayed ? "Yes" : "No" }}
      </li>
    </ul>

    <p v-else>No unplayed songs available.</p>
    <div v-if="selectedSong">
      <h3>Selected Song</h3>
      <p><strong>Song ID:</strong> {{ selectedSong.songId }}</p>
      <p><strong>Song Title:</strong> {{ selectedSong.songTitle }}</p>
      <p><strong>Suggested By:</strong> {{ selectedSong.suggestedBy }}</p>
      <button @click="submitSelectedSong">Submit Song to Current Round</button>
    </div>
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
import { useRouter } from "vue-router";
const router = useRouter();
// Session store for current session details
const sessionStore = useSessionStore();
const roomId = sessionStorage.getItem("roomId") as string;
const currentGame = computed(() => sessionStore.currentGame);
const currentRound = computed(() => sessionStore.currentRound);
const allSongsPlayed = ref(false);
// Reactive variable for storing player songs and selected song
const playerSongs = ref<Record<string, PlayerSong>>({});

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

    alert("Song submitted to the current round.");
    router.push({ name: "PlaySong", params: { roomId } });
  } catch (error) {
    console.error("Error submitting song to current round:", error);
    alert("Failed to submit the song. Please try again.");
  }
};
</script>

<style scoped>
.dj-panel {
  text-align: center;
  margin-top: 50px;
}

ul {
  list-style-type: none;
  padding: 0;
}

.song-item {
  margin: 10px 0;
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
}

.song-item.selected {
  background-color: #f0f0f0;
  border-color: #007bff;
}

button {
  margin-top: 20px;
  padding: 10px 20px;
  cursor: pointer;
}
</style>
